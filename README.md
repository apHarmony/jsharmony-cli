# ==============
# jsharmony-cli
# ==============

jsHarmony command-line interface

## Prerequisites

* Node.js

## Installation

```
npm install -g jsharmony-cli
```

After installation, the "jsharmony" program should be available from your shell.

If jsharmony doesn't run, ensure the Node.js npm folder is in your system PATH variable.

## Usage

```
-------------------
:::jsHarmony CLI:::
-------------------
Usage: jsharmony [command] [options]

The following commands are available:

create factory       - Initializes a standard application
    --with-client-portal | --no-client-portal | --with-sample-data | --admin-pass [PASSWORD]
create project [URL] - Initializes a jsHarmony Application from a Project URL
                         * A local filesystem path can also be used
create empty         - Initializes empty scaffolding
create tutorials     - Initializes the quickstart tutorials application

create database      - Creates a new jsHarmony Factory database
init database        - Adds jsHarmony Factory tables to an existing database
    --with-client-portal | --no-client-portal | --with-sample-data | --admin-pass [PASSWORD]

generate models     - Auto-generate models based on the database schema
    -t [DATABASE TABLE]  Database table name, or * for all tables (required)
    -f [FILENAME]        Output filename (optional)
    -d [PATH]            Output path (optional)
    -db [DATABASE]      Target database (optional)
generate sqlobjects - Auto-generate sqlobjects based on the database schema
    -t [DATABASE TABLE]  Database table name, or * for all tables (required)
    -f [FILENAME]        Output filename (optional)
    -d [PATH]            Output path (optional)
    -db [DATABASE]       Target database (optional)
    --with-data          Include data in generated models
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
