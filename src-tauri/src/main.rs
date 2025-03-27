// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use litforge_notes_lib::menu;
use objc::{msg_send, sel, sel_impl};
use std::env;
use tauri::{Manager, Runtime, WindowEvent};

const WINDOW_CONTROL_PAD_X: f64 = 18.0;
const WINDOW_CONTROL_PAD_Y: f64 = 26.0;

struct UnsafeWindowHandle(*mut std::ffi::c_void);
unsafe impl Send for UnsafeWindowHandle {}
unsafe impl Sync for UnsafeWindowHandle {}

// This function is needed to configure window shadows on macOS
#[cfg(target_os = "macos")]
pub trait WindowExt {
    fn set_win_effects(&self) -> tauri::Result<()>;
    fn update_window_controls_pos(&self);
}

#[cfg(target_os = "macos")]
impl<R: Runtime> WindowExt for tauri::Window<R> {
    fn set_win_effects(&self) -> tauri::Result<()> {
        use cocoa::appkit::{NSWindow, NSWindowStyleMask};
        use cocoa::base::{id, nil, YES};
        use cocoa::foundation::NSAutoreleasePool;

        unsafe {
            let pool = NSAutoreleasePool::new(nil);
            let ns_window = self.ns_window().unwrap() as id;

            // Enable full-size content view
            let style_mask = ns_window.styleMask();
            ns_window
                .setStyleMask_(style_mask | NSWindowStyleMask::NSFullSizeContentViewWindowMask);

            // Set titlebar transparent
            ns_window.setTitlebarAppearsTransparent_(YES);
            ns_window
                .setTitleVisibility_(cocoa::appkit::NSWindowTitleVisibility::NSWindowTitleHidden);

            pool.drain();
        }
        Ok(())
    }

    fn update_window_controls_pos(&self) {
        let window_handle = UnsafeWindowHandle(self.ns_window().unwrap());

        let _ = self.run_on_main_thread(move || {
            let handle = window_handle;
            set_window_controls_pos(
                handle.0 as cocoa::base::id,
                WINDOW_CONTROL_PAD_X,
                WINDOW_CONTROL_PAD_Y,
            );
        });
    }
}

#[cfg(target_os = "macos")]
fn set_window_controls_pos(window: cocoa::base::id, x: f64, y: f64) {
    use cocoa::{
        appkit::{NSView, NSWindow, NSWindowButton},
        foundation::NSRect,
    };

    unsafe {
        let close = window.standardWindowButton_(NSWindowButton::NSWindowCloseButton);
        let miniaturize = window.standardWindowButton_(NSWindowButton::NSWindowMiniaturizeButton);
        let zoom = window.standardWindowButton_(NSWindowButton::NSWindowZoomButton);

        let title_bar_container_view = close.superview().superview();

        let close_rect: NSRect = msg_send![close, frame];
        let button_height = close_rect.size.height;

        let title_bar_frame_height = button_height + y;
        let mut title_bar_rect = NSView::frame(title_bar_container_view);
        title_bar_rect.size.height = title_bar_frame_height;
        title_bar_rect.origin.y = NSView::frame(window).size.height - title_bar_frame_height;
        let _: () = msg_send![title_bar_container_view, setFrame: title_bar_rect];

        let window_buttons = vec![close, miniaturize, zoom];
        let space_between = NSView::frame(miniaturize).origin.x - NSView::frame(close).origin.x;

        for (i, button) in window_buttons.into_iter().enumerate() {
            let mut rect: NSRect = NSView::frame(button);
            rect.origin.x = x + (i as f64 * space_between);
            button.setFrameOrigin(rect.origin);
        }
    }
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();

    // Initialize the database pool
    litforge_notes_lib::db::init_pool()
        .await
        .expect("Failed to initialize database pool");

    // In Tauri 2.0, we need to use the plugin system differently
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Debug)
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Webview,
                ))
                .build(),
        )
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                if let Some(window) = app.get_window("main") {
                    let _ = window.set_win_effects();
                    let _ = window.update_window_controls_pos();
                }
            }

            let _ = menu::setup_menu(app);

            Ok(())
        })
        .on_window_event(move |window, event| match event {
            #[cfg(target_os = "macos")]
            WindowEvent::CloseRequested { api, .. } => {
                window
                    .app_handle()
                    .hide()
                    .expect("Window should hide on macOS");
                api.prevent_close();
            }
            #[cfg(target_os = "macos")]
            WindowEvent::Resized(_) => {
                // Redraw window controls on MacOS otherwise they are restored to default position
                window.update_window_controls_pos();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            litforge_notes_lib::commands::fetch_books_authors,
            litforge_notes_lib::commands::get_all_quotes,
            litforge_notes_lib::commands::fetch_books_by_author,
            litforge_notes_lib::commands::create_author,
            litforge_notes_lib::commands::delete_author,
            litforge_notes_lib::commands::create_book,
            litforge_notes_lib::commands::update_book,
            litforge_notes_lib::commands::delete_book,
            litforge_notes_lib::commands::create_quote,
            litforge_notes_lib::commands::update_quote,
            litforge_notes_lib::commands::delete_quote,
            litforge_notes_lib::commands::toggle_quote_starred,
            litforge_notes_lib::commands::set_quote_starred,
            litforge_notes_lib::commands::search_notes,
            litforge_notes_lib::commands::search_books_by_title,
            litforge_notes_lib::commands::search_authors_by_name,
            litforge_notes_lib::commands::get_random_quote,
            litforge_notes_lib::commands::get_starred_quotes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
