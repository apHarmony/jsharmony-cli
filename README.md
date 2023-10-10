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

create factory        - Initializes a standard application
    --with-client-portal | --no-client-portal | --with-sample-data | --admin-pass [PASSWORD]
create project [NAME] - Initializes a jsHarmony application from the App Library
    --path [PATH]         (optional) Local filesystem path to project source
    --url [URL]           (optional) URL path to project source
create empty          - Initializes empty scaffolding
create tutorials      - Initializes the quickstart tutorials application

create database       - Creates a new jsHarmony Factory database
init database         - Adds jsHarmony Factory tables to an existing database
    --with-client-portal | --no-client-portal | --with-sample-data | --admin-pass [PASSWORD]

For verbose diagnostic messages, append the -v flag

generate salt         - Generate a random salt
    --no-symbols          Generate without symbols
    --length [LENGTH]     Generate salt with a certain length
generate cert         - Generate a self-signed certificate
    --domain [DOMAIN]     Certificate domain (optional)
generate models      - Auto-generate models based on the database schema
    -t [DATABASE TABLE]  Database table name, or * for all tables (required)
    -f [FILENAME]        Output filename (optional)
    -d [PATH]            Output path (optional)
    -db [DATABASE]      Target database (optional)
generate sqlobjects  - Auto-generate sqlobjects based on the database schema
    -t [DATABASE TABLE]  Database table name, or * for all tables (required)
    -f [FILENAME]        Output filename (optional)
    -d [PATH]            Output path (optional)
    -db [DATABASE]       Target database (optional)
    --with-data          Include data in generated models
    --where [WHERE]      WHERE clause for export data (optional)

test install           - Install jsharmony-test in the current project
test recorder          - Open a browser to record a new test
    --full-element-paths  (optional) Generate full element paths instead of shortest path
test master screenshots- Recreate the master set of screenshots for tests
    --config [PATH]       (optional) Local filesystem path to an alternate test config file
    --show-browser        Show the browser window used for screenshot capture
    --silent              Do not open image review afterwards
test screenshots       - Recreate comparison images and run comparison report
    --config [PATH]       (optional) Local filesystem path to an alternate test config file
    --show-browser        Show the browser window used for screenshot capture
    --silent              Do not open comparison report afterwards

watch [path1] [path2]  - Watch paths for changes
    --exec [CMD]             (optional) Shell command to execute on change
    --exec-for [REGEX] [CMD] (optional) Shell command to execute on change for path regex
    --notify-port [PORT]     (optional) HTTP Endpoint that notifies clients of changes
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
