pragma solidity ^0.5.0;

contract TodoList {
  uint public taskCount = 0;

  struct Task {
    uint id;
    string content;
    bool completed;
    bool exists;  // Track if task exists or has been deleted
  }

  mapping(uint => Task) public tasks;

  event TaskCreated(
    uint id,
    string content,
    bool completed
  );

  event TaskCompleted(
    uint id,
    bool completed
  );
  
  event TaskUpdated(
    uint id,
    string content
  );
  
  event TaskDeleted(
    uint id
  );

  constructor() public {
    createTask("Task #1");
  }

  function createTask(string memory _content) public {
    taskCount ++;
    tasks[taskCount] = Task(taskCount, _content, false, true);
    emit TaskCreated(taskCount, _content, false);
  }
  
  function updateTask(uint _id, string memory _content) public {
    // Make sure task exists and hasn't been deleted
    require(_id > 0 && _id <= taskCount, "Task does not exist");
    require(tasks[_id].exists, "Task has been deleted");
    
    // Update task content
    Task memory _task = tasks[_id];
    _task.content = _content;
    tasks[_id] = _task;
    
    emit TaskUpdated(_id, _content);
  }
  
  function deleteTask(uint _id) public {
    // Make sure task exists and hasn't been deleted
    require(_id > 0 && _id <= taskCount, "Task does not exist");
    require(tasks[_id].exists, "Task has been deleted");
    
    // Mark task as deleted but keep it in the mapping for id consistency
    Task memory _task = tasks[_id];
    _task.exists = false;
    tasks[_id] = _task;
    
    emit TaskDeleted(_id);
  }
  
  function toggleCompleted(uint _id) public {
    // Make sure task exists and hasn't been deleted
    require(_id > 0 && _id <= taskCount, "Task does not exist");
    require(tasks[_id].exists, "Task has been deleted");
    
    Task memory _task = tasks[_id];
    _task.completed = !_task.completed;
    tasks[_id] = _task;
    emit TaskCompleted(_id, _task.completed);
  }
}

