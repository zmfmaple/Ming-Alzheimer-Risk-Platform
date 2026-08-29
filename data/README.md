# Data Directories

- `raw/`: source dataset used for model development.
- `runtime/`: active local SQLite database; ignored by Git.
- `legacy/`: preserved older database snapshots; not used by the application.

Do not place restricted HCAP respondent-level data here. Follow
`research/hcap/README.md` for that analysis.
