// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use liture_notes_lib::menu;
use objc::{msg_send, sel, sel_impl};
use std::env;
use tauri::{Manager, Runtime, WindowEvent};
use tauri_plugin_dialog::DialogExt;

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
            let app_handle = app.handle().clone();

            // Initialize the database pool
            tauri::async_runtime::spawn(async move {
                match liture_notes_lib::db::init_pool(app_handle.clone()).await {
                    Ok(_) => {
                        // Only show the main window after successful initialization
                        if let Some(window) = app_handle.get_window("main") {
                            let _ = window.show();
                        }
                    }
                    Err(e) => {
                        log::error!("Failed to initialize database: {}", e);
                    }
                }
            });

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
            // Import
            liture_notes_lib::commands::import_from_ibooks,
            liture_notes_lib::commands::import_from_kobo,
            liture_notes_lib::commands::import_from_kindle,
            // Fetch
            // Tags
            liture_notes_lib::commands::get_tags,
            liture_notes_lib::commands::get_quotes_by_tag,
            liture_notes_lib::commands::create_tag,
            liture_notes_lib::commands::delete_tag,
            liture_notes_lib::commands::add_quote_tag,
            liture_notes_lib::commands::delete_quote_tag,
            liture_notes_lib::commands::get_quote_tags,
            liture_notes_lib::commands::get_tags_by_book_id,
            // Authors
            liture_notes_lib::commands::create_author,
            liture_notes_lib::commands::update_author,
            liture_notes_lib::commands::delete_author,
            // Books
            liture_notes_lib::commands::get_books_by_author,
            liture_notes_lib::commands::get_books_with_authors,
            liture_notes_lib::commands::create_book,
            liture_notes_lib::commands::update_book,
            liture_notes_lib::commands::delete_book,
            liture_notes_lib::commands::create_book_with_author,
            // Quotes
            liture_notes_lib::commands::get_book_quotes,
            liture_notes_lib::commands::create_quote,
            liture_notes_lib::commands::update_quote,
            liture_notes_lib::commands::delete_quote,
            // Chapters
            liture_notes_lib::commands::get_book_chapters,
            // Starred
            liture_notes_lib::commands::toggle_quote_starred,
            liture_notes_lib::commands::set_quote_starred,
            liture_notes_lib::commands::get_starred_quotes,
            // Random
            liture_notes_lib::commands::get_random_quote,
            // Notes
            liture_notes_lib::commands::get_book_notes,
            liture_notes_lib::commands::create_note,
            liture_notes_lib::commands::update_note,
            // Search
            liture_notes_lib::commands::search_quotes,
            liture_notes_lib::commands::search_books_by_title,
            liture_notes_lib::commands::search_authors_by_name,
            liture_notes_lib::commands::search_quotes_by_book_title,
            liture_notes_lib::commands::search_quotes_by_author_name,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
