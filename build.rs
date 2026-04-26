use chrono::Local;
use std::env;
use std::fs::File;
use std::io::Write;
use std::path::Path;

fn main() {
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("build_info.rs");
    let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S UTC").to_string();
    
    let profile = if env::var("PROD_BUILD").is_ok() {
        "prod"
    } else if env::var("RELEASE_BUILD").is_ok() || env::var("BUILD_PROFILE").map_or(false, |p| p == "release") {
        "prod"
    } else {
        "dev"
    };
    
    File::create(&dest_path)
        .unwrap()
        .write_all(format!(
            "pub const BUILD_TIMESTAMP: &str = \"{}\";\npub const BUILD_PROFILE: &str = \"{}\";\n",
            timestamp, profile
        ).as_bytes())
        .unwrap();
    
    println!("cargo:rerun-if-changed=build.rs");
}