### Contents

+ [Project Import](#project-import)

---

### Project Import

Create a JSON file containing the project data you want to import. It should contain an srray of objects - one object for each project to be updated. Specify the path to this file in the hardcoded constant below, INPUT_FILE.

Example - updating an existing project:
```js
[{
  "chapterName": 'Oakland',
  "cycleNumber": 14,
  "projectName": 'boiling-pademelon',
  "memberHandles": ["superawsm", "malookwhaticando"]
}]
```

Example - creating a NEW project:
```js
[{
  "chapterName": 'Oakland',
  "cycleNumber": 14,
  "memberHandles": ["superawsm", "malookwhaticando"]
}]
```

To execute, run command:
```bash
$ npm run import:projects
```
