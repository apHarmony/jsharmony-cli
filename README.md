# ==============
# jsharmony-cli
# ==============

jsHarmony command-line interface

## Installation

npm install -g jsharmony-cli

## Usage

```
Usage: jsharmony [command] [options]

The following commands are available:

create factory   - Initializes a standard application
create empty     - Initializes empty scaffolding
create tutorials - Initializes the quickstart tutorials application
create database  - Creates a new jsHarmony Factory database
init database    - Adds jsHarmony Factory tables to an existing database
generate         - Auto-generate models based on the database schema
    -t [DATABASE TABLE]  Database table name, or * for all tables (required)
    -f [FILENAME]        Output filename (optional)
    -d [PATH]            Output path (optional)
```

## Examples

**1. Create a new jsHarmony Factory project:**

  ```jsharmony create factory```

**2. Initialize the tutorials project:**

  ```jsharmony create tutorials```

**3. Create a new empty project (for advanced use cases):**

  ```jsharmony create empty```

**4. Creates a new jsHarmony Factory database**

  ```jsharmony create database```

**5. Initialize jsHarmony Factory tables in an existing database**

  ```jsharmony init database```

**6. Generate model files for all the tables in the database**

  ```generate -t *```

**7. Generate model files for the "C" database table**

  ```generate -t C```

## Release History

* 1.0.0 Initial release