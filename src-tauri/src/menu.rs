use crate::import;
use std::str::FromStr;
use tauri::{menu::Menu, AppHandle, Manager, Wry};

#[derive(Debug, Clone, Copy, serde::Deserialize)]
pub enum MenuEvent {
    ImportFromKobo,
    ImportFromKindle,
    ImportFromiBooks,
}

impl ToString for MenuEvent {
    fn to_string(&self) -> String {
        match self {
            MenuEvent::ImportFromKobo => "import_from_kobo".to_string(),
            MenuEvent::ImportFromKindle => "import_from_kindle".to_string(),
            MenuEvent::ImportFromiBooks => "import_from_ibooks".to_string(),
        }
    }
}

impl FromStr for MenuEvent {
    type Err = ParseError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            // Convert to lowercase for case-insensitive matching
            "import_from_kobo" => Ok(MenuEvent::ImportFromKobo),
            "import_from_kindle" => Ok(MenuEvent::ImportFromKindle),
            "import_from_ibooks" => Ok(MenuEvent::ImportFromiBooks),
            _ => Err(ParseError::InvalidMenuEvent),
        }
    }
}

// Custom error type for parsing failures
#[derive(Debug)]
pub enum ParseError {
    InvalidMenuEvent,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            ParseError::InvalidMenuEvent => write!(f, "Invalid menu event string"),
        }
    }
}

impl std::error::Error for ParseError {}

fn setup_file_submenu(app: &mut tauri::App) -> tauri::Result<tauri::menu::Submenu<Wry>> {
    use tauri::menu::{MenuItemBuilder, SubmenuBuilder};

    // Create the "Import books" submenu
    let mut import_submenu = SubmenuBuilder::new(app, "Import books")
        .item(
            &MenuItemBuilder::with_id(MenuEvent::ImportFromKobo, "From Kobo Reader file")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id(MenuEvent::ImportFromKindle, "From Kindle Clippings file")
                .build(app)?,
        );

    // Add iBooks option only if running on macOS
    if cfg!(target_os = "macos") {
        import_submenu = import_submenu.item(
            &MenuItemBuilder::with_id(MenuEvent::ImportFromiBooks, "From iBooks") // Use a unique ID if needed
                .build(app)?,
        );
    }

    // Build the File submenu with the conditionally populated Import submenu
    SubmenuBuilder::new(app, "File")
        .item(&import_submenu.build()?)
        .build()
}

fn setup_app_submenu(app: &mut tauri::App) -> tauri::Result<tauri::menu::Submenu<Wry>> {
    use tauri::menu::{AboutMetadataBuilder, SubmenuBuilder};

    let config = app.config();
    let app_name_default = String::from("Notes");
    let app_name = config.product_name.as_ref().unwrap_or(&app_name_default);

    // Build the app submenu
    SubmenuBuilder::new(app, app_name)
        .about(Some(
            AboutMetadataBuilder::new()
                .name(Some("Notes".to_string()))
                .authors(Some(vec!["Elia Scotto".to_string()]))
                .license(Some(env!("CARGO_PKG_VERSION")))
                .version(Some(env!("CARGO_PKG_VERSION")))
                .build(),
        ))
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .quit()
        .build()
}

fn setup_edit_submenu(app: &mut tauri::App) -> tauri::Result<tauri::menu::Submenu<Wry>> {
    use tauri::menu::SubmenuBuilder;

    SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()
}

fn setup_view_submenu(app: &mut tauri::App) -> tauri::Result<tauri::menu::Submenu<Wry>> {
    use tauri::menu::SubmenuBuilder;

    SubmenuBuilder::new(app, "View")
        .minimize()
        .maximize()
        .fullscreen()
        .build()
}

fn setup_help_submenu(app: &mut tauri::App) -> tauri::Result<tauri::menu::Submenu<Wry>> {
    use tauri::menu::SubmenuBuilder;

    SubmenuBuilder::new(app, "Help").build()
}

pub fn setup_menu(app: &mut tauri::App) -> tauri::Result<Menu<Wry>> {
    app.on_menu_event(move |app, event: tauri::menu::MenuEvent| {
        if let Ok(event) = MenuEvent::from_str(&event.id().0) {
            let app_handle = app.clone();
            tauri::async_runtime::spawn(async move {
                handle_menu_event(&app_handle, event).await;
            });
        } else {
            println!("Unknown menu event: {}", event.id().0);
        }
    });

    #[cfg(not(target_os = "macos"))]
    {
        Menu::new(app)
    }
    #[cfg(target_os = "macos")]
    {
        use tauri::menu::MenuBuilder;

        let main_window = app.get_webview_window("main").unwrap();

        // Get the current menu
        let curr_menu = main_window.menu().expect("No default menu found");

        // Setup our custom submenus
        let file_submenu = setup_file_submenu(app)?;
        let app_submenu = setup_app_submenu(app)?;
        let edit_submenu = setup_edit_submenu(app)?;
        let view_submenu = setup_view_submenu(app)?;
        let help_submenu = setup_help_submenu(app)?;

        let mut new_menu = MenuBuilder::new(app);

        // Add the app submenu first
        new_menu = new_menu.item(&app_submenu);
        new_menu = new_menu.item(&file_submenu);
        new_menu = new_menu.item(&edit_submenu);
        new_menu = new_menu.item(&view_submenu);
        new_menu = new_menu.item(&help_submenu);

        let updated_menu = new_menu.build()?;
        app.set_menu(updated_menu.clone())?;

        // Ok(updated_menu)
        Menu::new(app)
    }
}

async fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
    match event {
        MenuEvent::ImportFromKobo => {
            import::import_from_kobo(app).await;
        }
        MenuEvent::ImportFromKindle => {
            import::import_from_kindle(app).await;
        }
        MenuEvent::ImportFromiBooks => {
            import::import_from_ibooks(app).await;
        }
    }
}
