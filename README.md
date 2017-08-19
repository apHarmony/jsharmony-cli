# ==================
# jsharmony-factory
# ==================

jsHarmony command-line interface

## Installation

npm install -g jsharmony-cli

## Usage

Usage: jsharmony [command] [options]

The following commands are available:

create factory   - Initializes a standard application
create empty     - Initializes empty scaffolding
create tutorials - Initializes the quickstart tutorials application
init db          - Initializes the jsHarmony Factory database
generate         - Auto-generate models based on the database schema
    -t [DATABASE TABLE]  Database table name, or * for all tables (required)
    -f [FILENAME]        Output filename (optional)
    -d [PATH]            Output path (optional)

1. Create a new jsHarmony Factory project:

  ```jsharmony create factory```

2. Initialize the tutorials project:

  ```jsharmony create tutorials```

3. Create a new empty project (for advanced use cases):

  ```jsharmony create empty```

4. Initialize the jsHarmony Factory database only (if an error occurred earlier)

  ```jsharmony init db```

5. Generate model files for all the tables in the database

  ```generate -t *```

6. Generate model files for the "C" database table

  ```generate -t C```

## Release History

* 1.0.0 Initial release