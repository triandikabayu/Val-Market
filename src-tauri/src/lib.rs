
/// Temporary diagnostic passthrough so the webview can report storefront
/// section presence in `tauri dev` logs. ponytail: remove after Phase 6.
#[tauri::command]
fn debug_log(message: String) {
  log::info!("[store] {message}");
}

#[cfg(desktop)]
mod desktop_login {
  //! Webview-window login: desktop-only (mobile has no multi-webview; the UI
  //! uses the system-browser + paste-URL flow there instead).
  use std::sync::mpsc;
  use std::time::{Duration, Instant};
  use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

  /// Opens Riot's official login page in a native webview. When Riot redirects
  /// to playvalorant.com/opt_in with the token fragment, the fragment is
  /// captured, the window closes, and the fragment is returned. Nothing but
  /// the fragment ever reaches the main app window.
  ///
  /// Capture is belt-and-suspenders: on_navigation fires earliest
  /// (pre-commit), a 250ms URL poll catches redirects the callback misses
  /// (WKWebView quirks).
  #[tauri::command]
  pub async fn riot_login(app: AppHandle, url: String) -> Result<String, String> {
    let target = url.parse::<tauri::Url>().map_err(|e| e.to_string())?;
    let (tx, rx) = mpsc::channel::<String>();
    let nav_app = app.clone();

    let window =
      WebviewWindowBuilder::new(&app, "riot-login", WebviewUrl::External(target))
        .title("Sign in with Riot")
        .inner_size(480.0, 740.0)
        .min_inner_size(380.0, 560.0)
        .on_navigation(move |nav| {
          if nav.host_str() == Some("playvalorant.com") {
            if let Some(fragment) = nav.fragment() {
              let _ = tx.send(fragment.to_string());
            }
          }
          // allow the navigation; the poll loop closes the window once it has
          // the fragment (closing from inside the callback can deadlock macOS)
          true
        })
        .build()
        .map_err(|e| e.to_string())?;

    let blocker = tauri::async_runtime::spawn_blocking(move || {
      let deadline = Instant::now() + Duration::from_secs(600);
      let mut last_url = String::new();
      loop {
        match rx.try_recv() {
          Ok(fragment) => {
            let _ = window.close();
            return Ok(fragment);
          }
          Err(mpsc::TryRecvError::Disconnected) => {
            return Err("login window closed before finishing".into());
          }
          Err(mpsc::TryRecvError::Empty) => {}
        }
        if Instant::now() >= deadline {
          let _ = window.close();
          return Err("sign-in timed out (10 min)".into());
        }
        if let Ok(current) = window.url() {
          let current = current.to_string();
          if current != last_url {
            log::info!("[riot-login] poll url: {current}");
            if current.starts_with("https://playvalorant.com") {
              if let Some(idx) = current.find('#') {
                let fragment = current[idx + 1..].to_string();
                log::info!(
                  "[riot-login] poll captured fragment ({} chars)",
                  fragment.len()
                );
                let _ = window.close();
                return Ok(fragment);
              }
            }
            last_url = current;
          }
        }
        std::thread::sleep(Duration::from_millis(250));
      }
    });

    match blocker.await {
      Ok(result) => result,
      Err(e) => {
        if let Some(w) = nav_app.get_webview_window("riot-login") {
          let _ = w.close();
        }
        Err(format!("login task failed: {e}"))
      }
    }
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let builder = tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_opener::init());

  #[cfg(desktop)]
  let builder = builder
    .invoke_handler(tauri::generate_handler![
      desktop_login::riot_login,
      debug_log
    ]);

  #[cfg(not(desktop))]
  let builder =
    builder.invoke_handler(tauri::generate_handler![debug_log]);

  builder
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
