# Job progress files

One file per running job: `progress/job-NN.json` with `job`, `title`, `owner`, `steps` (`[{name, done}]`),
`current` and `updated` (UTC, ISO 8601). The board shows percent = done steps / total steps. No file = "not reported".
Job owners edit only their own file with one small push to `factory/gameplay-v1` each time a step flips. Delete the file when the job merges.
