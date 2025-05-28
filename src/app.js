App = {
  loading: false,
  contracts: {},
  taskCount: 0,
  animationDelay: 100,

  load: async () => {
    try {
      // Load app...
      console.log("App starting to load...");
      
      // First try to load Web3 and MetaMask
      const web3Loaded = await App.loadWeb3();
      console.log("Web3 load result:", web3Loaded);
      
      if (web3Loaded) {
        // If Web3 loaded successfully, continue with the rest
        const accountLoaded = await App.loadAccount();
        console.log("Account load result:", accountLoaded);
        
        if (accountLoaded) {
          // Load contract and verify connection
          const contractLoaded = await App.loadContract();
          console.log("Contract load result:", contractLoaded);
          
          if (contractLoaded) {
            // If everything loaded, render the UI
            await App.render();
            return true;
          } else {
            // Show contract connection error
            document.getElementById('loader').innerHTML = `
              <div class="text-center">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: var(--warning-color); margin-bottom: 20px;"></i>
                <h4>Contract Connection Error</h4>
                <p>Could not connect to the TodoList contract. Make sure it's deployed to the current network.</p>
                <button class="btn btn-primary mt-3" onClick="window.location.reload()">
                  <i class="fas fa-sync-alt"></i> Try Again
                </button>
              </div>
            `;
          }
        } else {
          // Show MetaMask connection message if account not loaded
          document.getElementById('loader').innerHTML = `
            <div class="text-center">
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" style="width: 80px; margin-bottom: 20px;">
              <h4>Please Connect to MetaMask</h4>
              <p>Click the MetaMask extension and connect your account</p>
              <button class="btn btn-primary mt-3" onClick="App.reconnectMetaMask()">
                <i class="fas fa-plug"></i> Connect MetaMask
              </button>
            </div>
          `;
        }
      } else {
        // Show MetaMask installation message
        document.getElementById('loader').innerHTML = `
          <div class="text-center">
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" style="width: 80px; margin-bottom: 20px;">
            <h4>MetaMask Not Detected</h4>
            <p>You need to install MetaMask to use this application</p>
            <a href="https://metamask.io/download/" target="_blank" class="btn btn-primary mt-3">
              <i class="fas fa-download"></i> Install MetaMask
            </a>
          </div>
        `;
      }
      return false;
    } catch (error) {
      console.error('Error loading application:', error);
      document.getElementById('loader').innerHTML = `
        <div class="text-center">
          <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--danger-color); margin-bottom: 15px;"></i>
          <h4>Application Error</h4>
          <p>${error.message || 'Unknown error occurred'}</p>
          <button class="btn btn-primary mt-3" onClick="window.location.reload()">
            <i class="fas fa-sync-alt"></i> Try Again
          </button>
        </div>
      `;
      return false;
    }
  },

  // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
  // Helper function to reconnect MetaMask
  reconnectMetaMask: async () => {
    console.log('Manually reconnecting to MetaMask...');
    await App.loadWeb3();
    await App.loadAccount();
    await App.loadContract();
    await App.render();
  },
  
  loadWeb3: async () => {
    console.log('Attempting to connect to Web3...');
    try {
      console.log('Checking for window.ethereum:', window.ethereum ? 'Available' : 'Not available');
      // Modern MetaMask (EIP-1193)
      if (window.ethereum) {
        // Use the ethereum provider directly instead of the deprecated web3.currentProvider
        App.web3Provider = window.ethereum;
        window.web3 = new Web3(window.ethereum);
        
        // Update UI to show connecting state
        document.querySelector('.metamask-status').classList.remove('status-connected');
        document.querySelector('.metamask-status').classList.add('status-disconnected');
        document.getElementById('connection-status').innerText = 'Requesting connection...';
        
        try {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log('MetaMask connection successful!');
          
          // Set up listeners for account/network changes with modern API
          window.ethereum.on('accountsChanged', function (accounts) {
            console.log('MetaMask account changed:', accounts[0]);
            App.account = accounts[0];
            App.render();
          });
          
          window.ethereum.on('chainChanged', function(chainId) {
            console.log('MetaMask network changed. New chain ID:', chainId);
            window.location.reload();
          });
          
          // Connection successful
          document.querySelector('.metamask-status').classList.remove('status-disconnected');
          document.querySelector('.metamask-status').classList.add('status-connected');
          document.getElementById('connection-status').innerText = 'Connected to Ethereum network';
          
          return true;
        } catch (error) {
          // User denied account access
          console.error('User denied account access');
          document.getElementById('connection-status').innerText = 'Connection rejected';
          return false;
        }
      }
      // Non-dapp browsers
      else {
        document.querySelector('.metamask-status').classList.remove('status-connected');
        document.querySelector('.metamask-status').classList.add('status-disconnected');
        document.getElementById('connection-status').innerText = 'MetaMask not detected';
        console.log('Non-Ethereum browser detected. Please install MetaMask');
        return false;
      }
    } catch (error) {
      console.error('Error connecting to Web3:', error);
      document.getElementById('connection-status').innerText = 'Connection error';
      return false;
    }
  },

  loadAccount: async () => {
    try {
      // Get current account
      const accounts = await web3.eth.getAccounts();
      App.account = accounts[0];
      
      if (App.account) {
        // Show account container
        document.getElementById('account-container').style.display = 'flex';
        document.getElementById('connect-button').style.display = 'none';
        
        // Check if this is the specific account we're looking for
        const knownAccount = '0xD7dd031BC9743A2d070Cf641dB9bf0dFbF668685';
        const isKnownAccount = App.account.toLowerCase() === knownAccount.toLowerCase();
        
        // Format account display
        const shortenedAccount = App.account.substring(0, 6) + '...' + App.account.substring(App.account.length - 4);
        
        // Update account display
        const accountElement = document.getElementById('account');
        accountElement.innerText = shortenedAccount;
        
        // Apply special styling if it's the known account
        if (isKnownAccount) {
          accountElement.classList.add('known-account');
          document.querySelector('.account-pill').classList.add('known-account-pill');
          
          // Add verified badge if it doesn't exist already
          if (!document.querySelector('.verified-badge')) {
            document.querySelector('.account-pill').innerHTML += ' <span class="verified-badge" title="Verified Account"><i class="fas fa-check-circle"></i></span>';
          }
          
          App.showNotification('Connected with your verified account!', 'success');
        }
        
        return true;
      } else {
        // Hide account container and show connect button
        document.getElementById('account-container').style.display = 'none';
        document.getElementById('connect-button').style.display = 'block';
        return false;
      }
    } catch (error) {
      console.error('Error loading account:', error);
      document.getElementById('account-container').style.display = 'none';
      document.getElementById('connect-button').style.display = 'block';
      return false;
    }
  },

  loadContract: async () => {
    try {
      console.log('Loading contract...');
      // Create a JavaScript version of the smart contract
      const todoList = await $.getJSON('TodoList.json');
      console.log('Contract ABI loaded');
      
      App.contracts.TodoList = TruffleContract(todoList);
      App.contracts.TodoList.setProvider(App.web3Provider);
      
      try {
        // Get network ID
        const networkId = await web3.eth.net.getId();
        console.log('Current network ID:', networkId);
        
        // Check if contract is deployed to this network
        if (todoList.networks[networkId]) {
          // Hydrate the smart contract with values from the blockchain
          App.todoList = await App.contracts.TodoList.deployed();
          console.log('Contract instance loaded successfully');
          
          // Get initial task count to verify connection
          const taskCount = await App.todoList.taskCount();
          console.log('Current task count from blockchain:', taskCount.toNumber());
          
          return true;
        } else {
          console.error('Contract not deployed to the current network. Network ID:', networkId);
          App.showNotification('Contract not deployed to this network. Please check your MetaMask network settings.', 'error');
          return false;
        }
      } catch (deployError) {
        console.error('Error connecting to contract:', deployError);
        App.showNotification('Contract connection failed. Try redeploying the contract.', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error loading contract:', error);
      App.showNotification('Error loading contract ABI: ' + error.message, 'error');
      return false;
    }
  },

  render: async () => {
    // Only render if loading is false
    if (App.loading) {
      return;
    }
    
    // Update loading state
    App.setLoading(true);
    
    // Update account info
    $('#account').html(App.account);
    
    // Clean up any deleted tasks first
    await App.cleanupDeletedTasks();
    
    // Render tasks
    await App.renderTasks();
    
    // Update loading state
    App.setLoading(false);
  },
  
  // This function manually checks for deleted tasks and removes them from the UI
  cleanupDeletedTasks: async () => {
    try {
      console.log('Running cleanup for deleted tasks...');
      
      // Get all task elements currently in the DOM
      const taskElements = $('[data-id]');
      
      if (taskElements.length === 0) {
        console.log('No tasks to clean up');
        return;
      }
      
      console.log(`Found ${taskElements.length} tasks in UI, checking for deleted ones...`);
      
      // Check each task against the blockchain
      for (let i = 0; i < taskElements.length; i++) {
        const element = $(taskElements[i]);
        const taskId = element.attr('data-id');
        
        try {
          // Get task data from blockchain
          const task = await App.todoList.tasks(taskId);
          
          // Check exists flag - if false, remove from UI
          if (task && task.length > 3 && !task[3]) {
            console.log(`Task ${taskId} is marked as deleted in blockchain, removing from UI`);
            element.fadeOut(300, function() {
              $(this).remove();
            });
          }
        } catch (error) {
          console.error(`Error checking task ${taskId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error cleaning up deleted tasks:', error);
    }
  },

  renderTasks: async () => {
    try {
      console.log('Rendering tasks...');
      
      // Clear existing tasks first
      $('#taskList').empty();
      $('#completedTaskList').empty();
      
      // Check if contract is loaded
      if (!App.todoList) {
        console.error('Contract not loaded, attempting to reload');
        const success = await App.loadContract();
        if (!success) {
          throw new Error('Contract could not be loaded');
        }
      }
      
      // Try to get task count with error handling
      let taskCount;
      try {
        taskCount = await App.todoList.taskCount();
        App.taskCount = taskCount.toNumber();
        console.log('Total task count:', App.taskCount);
      } catch (error) {
        console.error('Error getting task count:', error);
        throw new Error('Could not get task count from blockchain. Try redeploying the contract.');
      }
      
      // Visible task counters
      let pendingCount = 0;
      let completedCount = 0;
      
      // Add the template back so we can clone it
      const taskTemplate = `
        <div class="task-item animated" style="display: none">
          <input type="checkbox" />
          <span class="content">Task content goes here...</span>
          <div class="task-actions">
            <button class="btn-edit" title="Edit Task">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" title="Delete Task">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      `;
      
      // Add a hidden template element back
      const $taskTemplate = $(taskTemplate);
      $taskTemplate.addClass('taskTemplate');
      $('#taskList').append($taskTemplate);
      
      console.log('About to process', App.taskCount, 'tasks');
      
      // Process each task
      for (let i = 1; i <= App.taskCount; i++) {
        try {
          // Get task data from blockchain
          const task = await App.todoList.tasks(i);
          console.log('Task data for ID', i, ':', task);
          
          // Extract task properties
          const id = parseInt(task[0]);
          const content = task[1];
          const completed = task[2];
          
          // Explicitly check the exists flag for task deletion status
          let exists = true;
          
          // The Task struct in the contract has an 'exists' flag at index 3
          // When a task is deleted, this is set to false in the contract
          if (task.length > 3) {
            // We need to be extra careful with Solidity boolean conversion
            // Using the raw value from the contract directly to avoid any type conversion issues
            exists = task[3];
            console.log(`Task ${id} exists flag:`, exists, typeof exists);
          }
          
          console.log(`Task ${id}:`, { content, completed, exists, existsRaw: task[3] });
          
          // IMPORTANT: Skip any tasks that have been deleted
          // Strict check against false/0/undefined - all indicate non-existence
          if (!exists) {
            console.log('Skipping deleted task', id);
            continue;
          }
          
          // Create task element - moved inside try block to ensure variables are in scope
          const $newTask = $(taskTemplate);
          $newTask.attr('data-id', id);
          $newTask.find('.content').text(content);
          $newTask.find('input[type="checkbox"]').prop('checked', completed);
          
          // Increment counters
          if (completed) {
            completedCount++;
          } else {
            pendingCount++;
          }
          
          // Add event listeners with proper closure
          const taskId = id; // Create a new variable to capture in closure
          
          // Toggle completion
          $newTask.find('input[type="checkbox"]').on('click', function() {
            console.log('Checkbox clicked for task', taskId);
            App.toggleCompleted(taskId);
            return false; // Prevent immediate UI change
          });
          
          // Edit task
          $newTask.find('.btn-edit').on('click', function() {
            console.log('Edit clicked for task', taskId);
            App.openEditModal(taskId, content);
          });
          
          // Delete task
          $newTask.find('.btn-delete').on('click', function() {
            console.log('Delete clicked for task', taskId);
            App.deleteTask(taskId);
          });
          
          // Add to the appropriate list
          if (completed) {
            $('#completedTaskList').append($newTask);
          } else {
            $('#taskList').append($newTask);
          }
          
          // Show the task with animation
          $newTask.show();
        } catch (error) {
          console.error(`Error processing task ${i}:`, error);
          continue; // Skip this task and move to the next
        }
      }
      
      // Update task counter
      const totalVisible = pendingCount + completedCount;
      $('#taskCounter').text(totalVisible + (totalVisible === 1 ? ' task' : ' tasks'));
      console.log('Visible tasks:', totalVisible, '(Pending:', pendingCount, ', Completed:', completedCount, ')');
      
      // Handle empty states
      if (completedCount === 0) {
        $('.completed-header').hide();
      } else {
        $('.completed-header').show();
      }
      
      if (totalVisible === 0) {
        // Show empty state
        const emptyState = $(`
          <div class="text-center mt-4 pt-4">
            <i class="fas fa-clipboard" style="font-size: 48px; color: #dfe6e9; margin-bottom: 15px;"></i>
            <p style="color: #b2bec3;">No tasks yet. Add your first task above!</p>
          </div>
        `);
        $('#taskList').append(emptyState);
      }
    } catch (error) {
      console.error('Error rendering tasks:', error);
      App.showNotification('Error loading tasks: ' + error.message, 'error');
    }
  },

  createTask: async () => {
    try {
      const content = $('#newTask').val();
      
      if (!content || content.trim() === '') {
        App.showNotification('Please enter a task', 'warning');
        return;
      }
      
      console.log('Creating task with content:', content);
      
      // Show operation in progress
      $('#task-operations-indicator').show();
      $('#operation-text').text('Creating task on blockchain...');
      
      // Show notification
      App.showNotification('Creating task on the blockchain...', 'info');
      
      // Make sure we have the account
      if (!App.account) {
        await App.loadAccount();
      }
      console.log('Using account:', App.account);
      
      // Disable form while processing
      $('#newTask').prop('disabled', true);
      $('.task-submit').prop('disabled', true);
      
      try {
        // Create task transaction
        const result = await App.todoList.createTask(content, {from: App.account});
        console.log('Task creation transaction:', result);
        
        // Extract transaction receipt
        if (result && result.receipt) {
          console.log('Task creation receipt:', result.receipt);
        }
        
        // Extract task ID from events if possible
        if (result && result.logs && result.logs.length > 0) {
          const log = result.logs[0];
          console.log('Task creation event log:', log);
          if (log.args && log.args.id) {
            const newTaskId = log.args.id.toNumber();
            console.log('New task created with ID:', newTaskId);
          }
        }
        
        // Clear input field
        $('#newTask').val('');
        
        // Success notification
        App.showNotification('Task created successfully!', 'success');
        
        // Force reload of task data from blockchain
        await App.loadContract();
        
        // Render tasks without refreshing
        await App.renderTasks();
      } catch (txError) {
        console.error('Transaction error:', txError);
        App.showNotification('Transaction error: ' + txError.message, 'error');
      }
      
      // Re-enable form
      $('#newTask').prop('disabled', false);
      $('.task-submit').prop('disabled', false);
      
      // Hide operation indicator
      $('#task-operations-indicator').hide();
    } catch (error) {
      console.error('Error creating task:', error);
      App.showNotification('Error creating task: ' + error.message, 'error');
      $('#task-operations-indicator').hide();
      $('#newTask').prop('disabled', false);
      $('.task-submit').prop('disabled', false);
    }
  },

  toggleCompleted: async (taskId) => {
    try {
      // Show operation in progress
      $('#task-operations-indicator').show();
      $('#operation-text').text('Updating task status...');
      
      console.log('Toggling completion for task ID:', taskId);
      
      // Show notification
      App.showNotification('Updating task status...', 'info');
      
      try {
        // Get current task info before toggling
        const taskBefore = await App.todoList.tasks(taskId);
        const wasCompleted = taskBefore[2];
        console.log('Task before toggle - completed:', wasCompleted);
        
        // Update task status on blockchain
        const result = await App.todoList.toggleCompleted(taskId, {from: App.account});
        console.log('Toggle transaction result:', result);
        
        // Force reload contract to get fresh data
        await App.loadContract();
        
        // Get updated task info
        const taskAfter = await App.todoList.tasks(taskId);
        const isNowCompleted = taskAfter[2];
        console.log('Task after toggle - completed:', isNowCompleted);
        
        // Success notification
        const statusText = isNowCompleted ? 'completed' : 'pending';
        App.showNotification(`Task marked as ${statusText}!`, 'success');
        
        // Render tasks without refreshing
        await App.renderTasks();
      } catch (txError) {
        console.error('Transaction error:', txError);
        App.showNotification('Error updating task status: ' + txError.message, 'error');
      }
      
      // Hide operation indicator
      $('#task-operations-indicator').hide();
    } catch (error) {
      console.error('Error toggling completion status:', error);
      App.showNotification('Error updating task: ' + error.message, 'error');
      $('#task-operations-indicator').hide();
    }
  },

  setLoading: (boolean) => {
    App.loading = boolean;
    const loader = $('#loader');
    const content = $('#content');
    
    if (boolean) {
      // Instead of completely hiding content, we can show a loading overlay
      // for better UX during short operations
      if (App.firstLoad) {
        loader.show();
        content.hide();
      } else {
        // Just show a loading spinner for small operations
        // We could add a small loading indicator here
      }
    } else {
      loader.hide();
      content.show();
      App.firstLoad = false;
    }
  },
  
  // Add notification system
  showNotification: (message, type = 'info') => {
    // Check if notification container exists, if not create it
    let $notificationContainer = $('#notification-container');
    if ($notificationContainer.length === 0) {
      $notificationContainer = $('<div id="notification-container"></div>');
      $('body').append($notificationContainer);
      
      // Add styles for the notification container
      $notificationContainer.css({
        'position': 'fixed',
        'top': '80px',
        'right': '20px',
        'z-index': '9999',
        'max-width': '300px'
      });
    }
    
    // Create notification element
    const $notification = $('<div class="notification"></div>');
    let backgroundColor, color, icon;
    
    // Set styles based on notification type
    switch(type) {
      case 'success':
        backgroundColor = 'var(--success-color)';
        color = 'white';
        icon = 'fa-check-circle';
        break;
      case 'error':
        backgroundColor = 'var(--danger-color)';
        color = 'white';
        icon = 'fa-exclamation-circle';
        break;
      case 'warning':
        backgroundColor = 'var(--warning-color)';
        color = 'var(--dark-color)';
        icon = 'fa-exclamation-triangle';
        break;
      default: // info
        backgroundColor = 'var(--primary-color)';
        color = 'white';
        icon = 'fa-info-circle';
    }
    
    // Style the notification
    $notification.css({
      'background-color': backgroundColor,
      'color': color,
      'padding': '12px 15px',
      'border-radius': '8px',
      'margin-bottom': '10px',
      'box-shadow': '0 4px 12px rgba(0,0,0,0.15)',
      'display': 'flex',
      'align-items': 'center',
      'animation': 'fadeIn 0.3s ease-out forwards',
      'max-width': '100%',
      'opacity': '0',
      'transform': 'translateX(20px)'
    });
    
    // Add content
    $notification.html(`
      <i class="fas ${icon}" style="margin-right: 10px;"></i>
      <span>${message}</span>
    `);
    
    // Add to container
    $notificationContainer.append($notification);
    
    // Animate in
    setTimeout(() => {
      $notification.css({
        'opacity': '1',
        'transform': 'translateX(0)'
      });
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
      $notification.css({
        'opacity': '0',
        'transform': 'translateX(20px)'
      });
      
      setTimeout(() => {
        $notification.remove();
      }, 300);
    }, 3000);
  },
  // Edit task functionality
  openEditModal: async (taskId, content) => {
    try {
      console.log('Opening edit modal for task ID:', taskId);
      
      // Get the latest task data directly from the contract
      const task = await App.todoList.tasks(taskId);
      
      if (!task || (task.length > 3 && !task[3])) {
        console.error('Task not found or deleted');
        App.showNotification('Task not found or has been deleted', 'warning');
        return;
      }
      
      // Set modal values with the latest data
      $('#editTaskId').val(taskId);
      $('#editTaskContent').val(task[1]);
      
      // Show modal
      $('#editTaskModal').addClass('active');
      
      // Focus on the input and place cursor at the end
      setTimeout(() => {
        const input = document.getElementById('editTaskContent');
        input.focus();
        input.selectionStart = input.selectionEnd = input.value.length;
      }, 100);
    } catch (error) {
      console.error('Error opening edit modal:', error);
      App.showNotification('Error opening edit form', 'error');
    }
  },
  
  closeEditModal: () => {
    $('#editTaskModal').removeClass('active');
  },
  
  updateTask: async () => {
    try {
      const taskId = $('#editTaskId').val();
      const newContent = $('#editTaskContent').val().trim();
      
      if (!newContent) {
        App.showNotification('Task content cannot be empty', 'warning');
        return;
      }
      
      // Show operation in progress
      $('#task-operations-indicator').show();
      $('#operation-text').text('Updating task on blockchain...');
      
      // Close the modal immediately for better UX
      App.closeEditModal();
      
      // Find all elements with this task ID (could be in pending or completed list)
      const taskElements = $(`[data-id="${taskId}"]`);
      let originalContent = '';
      
      if (taskElements.length) {
        const contentElement = taskElements.find('.content');
        // Store original content in case of error
        originalContent = contentElement.text();
        
        // Add a visual indicator that it's being updated
        contentElement.addClass('saving-task');
        // Update the text immediately to make the UI feel responsive
        contentElement.text(newContent);
        
        // Show notification
        App.showNotification('Updating task...', 'info');
      } else {
        console.warn('Task element not found in DOM for ID:', taskId);
      }
      
      // Enable loading state
      App.setLoading(true);
      
      console.log('Updating task ID:', taskId, 'with new content:', newContent);
      
      try {
        // Update task on blockchain
        const result = await App.todoList.updateTask(taskId, newContent, {from: App.account});
        console.log('Update result:', result);
        
        // Watch for the TaskUpdated event
        const event = result.logs.find(log => log.event === 'TaskUpdated');
        if (event) {
          console.log('Task updated event received:', event);
        }
        
        // Success notification
        App.showNotification('Task updated successfully!', 'success');
        
        // Remove the saving indicator
        if (taskElements.length) {
          taskElements.find('.content').removeClass('saving-task');
        }
        
        // Refresh tasks to ensure everything is in sync
        await App.renderTasks();
      } catch (txError) {
        console.error('Transaction error updating task:', txError);
        App.showNotification('Error updating task on blockchain', 'error');
        
        // Revert the optimistic UI update
        if (taskElements.length && originalContent) {
          const contentElement = taskElements.find('.content');
          contentElement.text(originalContent);
          contentElement.removeClass('saving-task');
        } else {
          await App.renderTasks();
        }
        throw txError; // Re-throw to be caught by outer catch
      } finally {
        // Hide operation indicator
        $('#task-operations-indicator').hide();
        App.setLoading(false);
      }
    } catch (error) {
      console.error('Error in updateTask function:', error);
      App.showNotification('Error: ' + (error.message || 'Unknown error'), 'error');
      
      // Ensure UI is restored
      await App.renderTasks();
      
      $('#task-operations-indicator').hide();
      App.setLoading(false);
    }
  },
  
  deleteTask: async (taskId) => {
    try {
      // Confirm deletion with user
      if (!confirm('Are you sure you want to delete this task?')) {
        return; // User cancelled
      }
      
      // Show loading state
      $('#task-operations-indicator').show();
      $('#operation-text').text('Verifying task...');
      App.setLoading(true);
      
      // Important: First check if the task actually exists and is not already deleted
      try {
        const task = await App.todoList.tasks(taskId);
        console.log('Task data before deletion:', task);
        
        // Boolean conversion of the exists flag (task[3])
        const exists = Boolean(task[3]);
        
        if (!exists) {
          // Task is already marked as deleted in the contract
          console.warn(`Task ${taskId} is already marked as deleted in the contract`);
          App.showNotification('This task has already been deleted', 'warning');
          
          // Refresh UI to remove any stale tasks
          await App.renderTasks();
          
          $('#task-operations-indicator').hide();
          App.setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error checking task status:', error);
        App.showNotification('Could not verify task status', 'error');
        
        $('#task-operations-indicator').hide();
        App.setLoading(false);
        return;
      }
      
      // Find the DOM element
      const taskElement = $(`[data-id="${taskId}"]`);
      
      // Apply visual deletion animation
      if (taskElement.length) {
        // Add visual effect
        taskElement.addClass('deleting-task');
        taskElement.css({
          'opacity': '0.5',
          'transform': 'translateX(20px)',
          'pointer-events': 'none'
        });
        
        // After short delay, collapse the element
        setTimeout(() => {
          taskElement.css({
            'height': '0',
            'margin': '0',
            'padding': '0',
            'border': 'none'
          });
        }, 300);
      }
      
      // Update message
      $('#operation-text').text('Deleting task from blockchain...');
      App.showNotification('Deleting task...', 'info');
      
      try {
        // Call contract method with proper type conversion for the ID
        const txResult = await App.todoList.deleteTask(Number(taskId), {from: App.account});
        console.log('Delete transaction result:', txResult);
        
        // Success notification
        App.showNotification('Task deleted successfully!', 'success');
        
        // Force remove this task from UI immediately
        const taskElement = $(`[data-id="${taskId}"]`);
        if (taskElement.length) {
          taskElement.fadeOut(300, function() {
            $(this).remove();
          });
        }
        
        // Wait a moment then refresh the entire task list to ensure UI is in sync
        setTimeout(async () => {
          await App.renderTasks();
        }, 500);
      } catch (error) {
        console.error('Error during task deletion:', error);
        
        // Extract specific error message if available
        let errorMessage = 'Error deleting task';
        
        if (error.message) {
          if (error.message.includes('Task has been deleted')) {
            errorMessage = 'This task has already been deleted';
          } else if (error.message.includes('Task does not exist')) {
            errorMessage = 'This task does not exist';
          }
        }
        
        App.showNotification(errorMessage, 'error');
        
        // Refresh UI to ensure consistency
        await App.renderTasks();
      } finally {
        // Always reset UI state
        $('#task-operations-indicator').hide();
        App.setLoading(false);
      }
    } catch (error) {
      // Global error handler
      console.error('Unexpected error in deleteTask:', error);
      App.showNotification('An unexpected error occurred', 'error');
      
      // Reset UI state
      $('#task-operations-indicator').hide();
      App.setLoading(false);
      
      // Refresh UI
      await App.renderTasks();
    }
  }
}

// Initialize the app when the page loads
$(() => {
  // Set initial state
  App.firstLoad = true;
  
  // Modern approach for document ready
  $(document).ready(async function() {
    try {
      await App.load();
      
      // Set up event handlers for the edit modal
      $('#closeEditModal, #cancelEditTask').on('click', App.closeEditModal);
      $('#saveEditTask').on('click', App.updateTask);
      
      // Allow pressing Enter in the edit input to save
      $('#editTaskContent').on('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          App.updateTask();
        }
      });
      
    } catch (error) {
      console.error('Application failed to load:', error);
      // Show user-friendly error message
      document.getElementById('loader').innerHTML = `
        <div class="text-center">
          <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--danger-color); margin-bottom: 15px;"></i>
          <h4>Oops! Something went wrong</h4>
          <p>${error.message || 'Could not connect to the blockchain network'}</p>
          <button class="btn btn-primary mt-3" onClick="window.location.reload()">
            <i class="fas fa-sync-alt"></i> Try Again
          </button>
        </div>
      `;
    }
  });
});