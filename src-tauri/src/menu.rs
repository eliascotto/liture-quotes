use crate::import;
use std::str::FromStr;
use tauri::{menu::Menu, AppHandle, Manager, Wry, Emitter};

#[derive(Debug, Clone, Copy, serde::Deserialize)]
pub enum MenuEvent {
    ImportFromKobo,
    ImportFromKindle,
}

impl ToString for MenuEvent {
    fn to_string(&self) -> String {
        match self {
            MenuEvent::ImportFromKobo => "import_from_kobo".to_string(),
            MenuEvent::ImportFromKindle => "import_from_kindle".to_string(),
        }
    }
}

impl FromStr for MenuEvent {
    type Err = ParseError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {  // Convert to lowercase for case-insensitive matching
            "import_from_kobo" => Ok(MenuEvent::ImportFromKobo),
            "import_from_kindle" => Ok(MenuEvent::ImportFromKindle),
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

    // Build a new File submenu with the existing items plus the new "Save" item
    SubmenuBuilder::new(app, "File")
        .item(
            &SubmenuBuilder::new(app, "Import from...")
                .item(
                    &MenuItemBuilder::with_id(MenuEvent::ImportFromKobo, "Kobo Reader file")
                        // .accelerator("") // TODO
                        .build(app)?,
                )
                .item(
                    &MenuItemBuilder::with_id(MenuEvent::ImportFromKindle, "Kindle")
                        // .accelerator("") // TODO
                        .build(app)?,
                )
                .build()?,
        )
        .build()
}

fn setup_app_submenu(app: &mut tauri::App) -> tauri::Result<tauri::menu::Submenu<Wry>> {
    use tauri::menu::{AboutMetadataBuilder, SubmenuBuilder};

    let config = app.config();

    // Settings menu item
    // let settings = MenuItemBuilder::new("Settings...")
    //     .id("settings")
    //     .accelerator("CmdOrCtrl+,")
    //     .build(app)?;

    // Build the app submenu
    SubmenuBuilder::new(
        app,
        config.product_name.as_ref().unwrap_or(&"Nous".to_string()),
    )
    .about(Some(
        AboutMetadataBuilder::new()
            .name(Some("Notes".to_string()))
            .authors(Some(vec!["Elia Scotto".to_string()]))
            .license(Some(env!("CARGO_PKG_VERSION")))
            .version(Some(env!("CARGO_PKG_VERSION")))
            .build(),
    ))
    .separator()
    // .item(&settings)
    .separator()
    .services()
    .separator()
    .hide()
    .hide_others()
    .quit()
    .build()
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
        let curr_menu_items = curr_menu.items()?;

        // Setup our custom submenus
        let updated_file_submenu = setup_file_submenu(app)?;
        let app_submenu = setup_app_submenu(app)?;

        let mut new_menu = MenuBuilder::new(app);

        // Add the app submenu first
        new_menu = new_menu.item(&app_submenu);

        // Rebuild the rest of the menu with the updated File submenu
        // skip the first item as it's the app submenu
        for item in curr_menu_items.iter().skip(1) {
            if let Some(submenu) = item.as_submenu() {
                if submenu.text().map_or(false, |text| text == "File") {
                    new_menu = new_menu.item(&updated_file_submenu);
                } else if submenu.text().map_or(false, |text| text == "Edit") {
                    // Skip the Edit menu as it's handled by the app submenu
                    continue;
                } else {
                    new_menu = new_menu.item(item);
                }
            } else {
                new_menu = new_menu.item(item);
            }
        }

        let updated_menu = new_menu.build()?;
        app.set_menu(updated_menu.clone())?;

        Ok(updated_menu)
    }
}

async fn handle_menu_event(app: &AppHandle, event: MenuEvent) {
    let webview = app
        .get_webview_window("main")
        .expect("unable to find window");

    match event {
        MenuEvent::ImportFromKobo => match import::import_dialog(app).await {
            Ok(path) => {
                if let Ok(res) = import::import_kobo(&path).await {
                    log::info!("Import result: {}", res);
                } else {
                    log::error!("Error importing from Kobo");
                }
            }
            Err(e) => log::error!("Error importing from Kobo: {}", e),
        },
        MenuEvent::ImportFromKindle => webview.emit("import-from-kindle", ()).unwrap(),
    }
}
