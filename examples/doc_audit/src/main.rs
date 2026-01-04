//! # Documentation Audit Example
//!
//! This example demonstrates how to use the ADK documentation audit system
//! to validate documentation against actual crate implementations.

use adk_rust::doc_audit::{AuditOrchestrator, AuditConfig, OutputFormat};
use anyhow::Result;
use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "doc-audit-example")]
#[command(about = "Example usage of ADK documentation audit system")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run a full documentation audit
    Full {
        /// Path to the workspace root
        #[arg(short, long, default_value = ".")]
        workspace: PathBuf,
        
        /// Path to the documentation directory
        #[arg(short, long, default_value = "docs")]
        docs: PathBuf,
        
        /// Output format
        #[arg(short, long, default_value = "console")]
        format: String,
    },
    /// Validate a single documentation file
    Validate {
        /// Path to the documentation file
        file: PathBuf,
    },
    /// Run incremental audit on changed files
    Incremental {
        /// Path to the workspace root
        #[arg(short, long, default_value = ".")]
        workspace: PathBuf,
        
        /// Path to the documentation directory
        #[arg(short, long, default_value = "docs")]
        docs: PathBuf,
        
        /// Changed files to audit
        files: Vec<PathBuf>,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt::init();
    
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Full { workspace, docs, format } => {
            println!("Running full documentation audit...");
            println!("Workspace: {}", workspace.display());
            println!("Docs: {}", docs.display());
            
            let output_format = match format.as_str() {
                "json" => OutputFormat::Json,
                "markdown" => OutputFormat::Markdown,
                _ => OutputFormat::Console,
            };
            
            let config = AuditConfig::builder()
                .workspace_path(workspace)
                .docs_path(docs)
                .output_format(output_format)
                .build();
            
            let orchestrator = AuditOrchestrator::new(config)?;
            let report = orchestrator.run_full_audit().await?;
            
            println!("\n=== Audit Results ===");
            println!("Total files: {}", report.summary.total_files);
            println!("Files with issues: {}", report.summary.files_with_issues);
            println!("Total issues: {}", report.summary.total_issues);
            println!("Critical issues: {}", report.summary.critical_issues);
            println!("Warning issues: {}", report.summary.warning_issues);
            println!("Coverage: {:.1}%", report.summary.coverage_percentage);
            
            if report.summary.critical_issues > 0 {
                println!("\n❌ Audit failed with {} critical issues", report.summary.critical_issues);
                std::process::exit(1);
            } else {
                println!("\n✅ Audit passed!");
            }
        }
        
        Commands::Validate { file } => {
            println!("Validating file: {}", file.display());
            
            let config = AuditConfig::builder()
                .workspace_path(".")
                .docs_path("docs")
                .build();
            
            let orchestrator = AuditOrchestrator::new(config)?;
            let result = orchestrator.validate_file(&file).await?;
            
            println!("\n=== Validation Results ===");
            println!("Issues found: {}", result.issues.len());
            
            for issue in &result.issues {
                println!("  {} [{}:{}] {}", 
                    match issue.severity {
                        adk_rust::doc_audit::IssueSeverity::Critical => "❌",
                        adk_rust::doc_audit::IssueSeverity::Warning => "⚠️",
                        adk_rust::doc_audit::IssueSeverity::Info => "ℹ️",
                    },
                    issue.file_path.display(),
                    issue.line_number.unwrap_or(0),
                    issue.message
                );
                
                if let Some(suggestion) = &issue.suggestion {
                    println!("    💡 {}", suggestion);
                }
            }
            
            if result.issues.iter().any(|i| matches!(i.severity, adk_rust::doc_audit::IssueSeverity::Critical)) {
                std::process::exit(1);
            }
        }
        
        Commands::Incremental { workspace, docs, files } => {
            println!("Running incremental audit on {} files...", files.len());
            
            let config = AuditConfig::builder()
                .workspace_path(workspace)
                .docs_path(docs)
                .build();
            
            let orchestrator = AuditOrchestrator::new(config)?;
            let report = orchestrator.run_incremental_audit(&files).await?;
            
            println!("\n=== Incremental Audit Results ===");
            println!("Files audited: {}", files.len());
            println!("Issues found: {}", report.summary.total_issues);
            
            if report.summary.critical_issues > 0 {
                println!("❌ {} critical issues found", report.summary.critical_issues);
                std::process::exit(1);
            } else {
                println!("✅ No critical issues found");
            }
        }
    }
    
    Ok(())
}