use once_cell::sync::Lazy;

// Store the debug flag directly, initialized only once
pub static IS_DEBUG: Lazy<bool> = Lazy::new(|| {
    std::env::var("TAURI_ENV_DEBUG")
        .unwrap_or("false".to_string())
        .parse::<bool>()
        .unwrap_or(false)
});

// Macro for debug_print with parameterized strings
#[macro_export]
macro_rules! debug_print {
    ($($arg:tt)*) => {
        if *crate::utils::IS_DEBUG {
            println!("DEBUG: {}", format!($($arg)*));
        }
    };
}
