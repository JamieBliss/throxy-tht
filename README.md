# CSV AI Enrichment Webapp

### Frontend

- Index page
  - File upload component with loading indicator
  - Button to go to Results page
- Results page
  - Contains [datatable](#datatable) displaying enriched results from uploaded file(s)
  - Server-side filtering controls for key fields (e.g. country, domain, employee size)

### Backend

- API
  - POST /upload
    - Parses the CSV, converts rows to JSON for better AI consumption
    - Create raw_json manually to allow real traceability of AI enrichment
    - [What AI to use?](#what-ai-to-use)
    - Calls the selected AI model to enrich each record
    - Stores results in database
  - GET /companies
    - Returns filtered data from database
      - filters include, domain, country, and employee_size
  - GET /employee_size
    - Returns all employee sizes in the db
- Database
  - Need a DB column for each column in the csv file
    - Could implement a system to generate the Postgres table from the csv file (AI or TS) - OE (Over engineering)
    - Manually create DB table
      - To handle graceful updates need to identify column(s) as unique
        - Company name? - what if you had the same company but in different countries
        - domain? - Works but there are empty domains
        - Company name + domain - Allows for the same companies in different countries and unlikely to be two rows with both these fields empty
      - All columns are type string (apart from raw_json) would it be worth implementing an enum for employee_size, help enforce bucket names are correct? - OE

## Datatable

- Implemented server side filtering as it feels easier for me, client side would also be good especially on smaller datasets. On the other hand server side would scale better for bigger datasets.
- Handling filtering could have been done a few ways
  - I chose to have 3 simple filters at the top because:
    - See all current filters at a glance
    - Easy access as opposed to being tucked away in column header
    - Chose select as it is more appropriate for employee size groups
  - A chip system for filters was an interesting option but required more work

## Broad Design Choices

- keep it simple
- Dark and light mode - **non negotiable**
- MUI could be good but components not easily extended
- shadcn is perfect as it provides clean, unopinionated, extendable components
- tanstack table also ideal for datatable as suggested

## Testing

- Simple integration tests for API endpoints to verify success and error cases
- Basic UI smoke tests to ensure core flows (upload → enrich → display) work as expected
- Created my own csv file to test graceful uploads

## What AI to Use?

- Experimented with Google Gemini-1.5-flash, Gemini-2.5-flash, Gemini-2.5-pro, OpenAI 4o-mini, and Llama 3
- My aim was to find a balance of speed, reliability, and data quality
- Implemented google js api:
  - gemini-1.5-flash: Quick, data ok, but inconsistent
  - gemini-2.5-flash: Quickish and data was consistently good
  - gemini-2.5-pro: Waaaayyyyy to slow
- Implemented Open router to try out several models:
  - 4o-mini: Slower than gemini-2.5-flash but data was good
  - llama-3: Fastest but poor data quality

I went with Gemini 2.5 Flash since it reliably got key things right, like bucketing employee sizes. As there is a reasonable delay I added a loading button after upload was clicked to provide feedback to the user. I also used response schemas to keep the returned data structure consistent.

## Github Strategy

- For speed push directly to main - **this is not my standard practice**

## Potential Improvements

- Automatically generate DB tables based on csv. This table could also be used to create the tanstack datatable
- Let the user select which AI agent is used for enrichment
- Preview data pop-up. Before data is uploaded to DB give the user a chance to accept all, reject all or accept and reject specific rows
  - Allow prompt adjustments and re-run enrichment
- Editing of rows in datatable
- export datatable to csv
- provided extra feedback on file upload, `upload -> file uploaded -> model processing data -> finished`, rather than just `upload -> uploading -> finished`
