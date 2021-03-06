const TaskStatusSorting = {
  TASK_RUNNING: 0,
  TASK_STAGING: 1,
  TASK_FAILED: 2,
  TASK_ERROR: 3,
  TASK_KILLED: 4,
  TASK_KILLING: 5,
  TASK_FINISHED: 6,
  TASK_LOST: 7,
  TASK_UNREACHABLE: 8,
  TASK_GONE_BY_OPERATOR: 9,
  TASK_GONE: 10,
  TASK_CREATED: 11,
  TASK_STARTED: 12,
  TASK_DROPPED: 13,
  TASK_STARTING: 14,
  TASK_UNKNOWN: 15
};

module.exports = TaskStatusSorting;
