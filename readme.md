# RMS Candidate Assessment

Completed by John Prutton on 2024/08/26.

## Task

Write a program to do tariff calculations for a single-phase house in the City of Tshwane.

### Assumptions

- The program will use the provided CSV file of readings from an electricity meter as input.
- All dates should be from the financial year of 1 July 2023 to 30 June 2024.
- The readings are measured in Watt-hours and need to be divided by 1000 to be in kWh.
- The readings come from a house that meets the "Domestic Standard Supply" criteria as stated in the accompanying documents.
  - The house is using a conventional meter.
  - The house is charged from the last reading in a month to the last reading of the previous month.
- The blocks are:
  - 0 < x <= 100kWh at 241.37c/kWh
    - 100 kWh will work out to be: `100 * 241.37c = 24137c`
  - 100 < x <= 450kWh at 282.47c/kWh
    - 100.5 kWh will work out to be: `100 * 241.37c + 0.5 * 282.47c = 24278.235c`
    - 450 kWh will work out to be: `100 * 241.37c + 350 * 282.47c = 123001.5c`
  - 450 < x <= 650kWh
    - 450.5 kWh will work out to be: `100 * 241.37c + 350 * 282.47c + 0.5 * 307.75c = 123155.375c`
    - 650 kWh will work out to be: `100 * 241.37c + 350 * 282.47c + 200 * 307.75c = 184551.5c`
  - 650 < x
    - 650.5 kWh will work out to be: `100 * 241.37c + 350 * 282.47c + 200 * 307.75c + 0.5 * 331.76 = 184717.38c`

## How to run

### Using PNPM

With pnpm>9.0.0,

- `pnpm install --frozen-lockfile`
- `pnpm start`

### Using Docker

- `docker build -t rms-assessment .`
- `docker run --name rms-assessment-container rms-assessment`

## Results

```shell
2023/07: R4033.15 (1309.403kWh, 403315.03928c)
2023/08: R117.70 (48.764kWh, 11770.16668c)
```
