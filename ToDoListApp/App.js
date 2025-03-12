import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

// Define the Task interface (using JSDoc for type-like documentation)
/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {boolean} completed
 * @property {'low' | 'medium' | 'high'} priority
 * @property {Date | null} dueDate
 * @property {string} category
 */

const categories = ['Personal', 'Work', 'Shopping', 'Health', 'Other'];

export default function App() {
  const [taskTitle, setTaskTitle] = useState('');
  /** @type {[Task[], Function]} */
  const [tasks, setTasks] = useState([]);
  const [priority, setPriority] = useState('medium');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('none');
  const [editingTask, setEditingTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Load tasks from AsyncStorage on mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Save tasks to AsyncStorage whenever they change
  useEffect(() => {
    saveTasks();
  }, [tasks]);

  // Add click outside handler to close menus
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleClickOutside = (e) => {
        const target = e.target;
        const isFilterButton = target.closest('.web-filter-button');
        const isDropdownMenu = target.closest('.web-dropdown-menu');
        
        if (!isFilterButton && !isDropdownMenu) {
          setShowSortMenu(false);
          setShowPriorityMenu(false);
          setShowCategoryMenu(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  // Load tasks from AsyncStorage
  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem('tasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        parsedTasks.forEach((task) => {
          if (task.dueDate) {
            task.dueDate = new Date(task.dueDate);
          }
        });
        setTasks(parsedTasks);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load tasks');
    }
  };

  // Save tasks to AsyncStorage
  const saveTasks = async () => {
    try {
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      Alert.alert('Error', 'Failed to save tasks');
    }
  };

  // Function to handle adding tasks to the list
  const addTaskHandler = () => {
    if (taskTitle.trim().length === 0) {
      Alert.alert('Invalid Input', 'Please enter a task title');
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title: taskTitle,
      completed: false,
      priority,
      dueDate: selectedDate,
      category: selectedCategory,
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);
    resetForm();
  };

  // Function to reset form
  const resetForm = () => {
    setTaskTitle('');
    setPriority('medium');
    setSelectedDate(null);
    setSelectedCategory('Personal');
  };

  // Function to edit task
  const editTask = (task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setPriority(task.priority);
    setSelectedDate(task.dueDate);
    setSelectedCategory(task.category);
    setShowEditModal(true);
  };

  // Function to save edited task
  const saveEditedTask = () => {
    if (!editingTask) return;

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === editingTask.id
          ? {
              ...task,
              title: taskTitle,
              priority,
              dueDate: selectedDate,
              category: selectedCategory,
            }
          : task
      )
    );

    setShowEditModal(false);
    setEditingTask(null);
    resetForm();
  };

  // Function to delete a task
  const deleteTaskHandler = (taskId) => {
    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  };

  // Function to toggle task completion
  const toggleTaskCompletion = (taskId) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Function to get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FFA000';
      case 'high':
        return '#F44336';
      default:
        return '#ddd';
    }
  };

  // Handle dropdown clicks
  const handleDropdownClick = (e, dropdownType) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      e.stopPropagation();
    }
    
    switch (dropdownType) {
      case 'sort':
        setShowSortMenu(!showSortMenu);
        setShowPriorityMenu(false);
        setShowCategoryMenu(false);
        break;
      case 'priority':
        setShowPriorityMenu(!showPriorityMenu);
        setShowSortMenu(false);
        setShowCategoryMenu(false);
        break;
      case 'category':
        setShowCategoryMenu(!showCategoryMenu);
        setShowSortMenu(false);
        setShowPriorityMenu(false);
        break;
    }
  };

  // Handle dropdown selection
  const handleDropdownSelect = (e, type, value) => {
    if (Platform.OS === 'web') {
      e.preventDefault();
      e.stopPropagation();
    }
    
    switch (type) {
      case 'sort':
        setSortBy(value);
        setShowSortMenu(false);
        break;
      case 'priority':
        setFilterPriority(value);
        setShowPriorityMenu(false);
        break;
      case 'category':
        setFilterCategory(value);
        setShowCategoryMenu(false);
        break;
    }
  };

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = [...tasks]; // Create a copy of tasks array

    // Apply search filter
    if (searchQuery) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply priority filter
    if (filterPriority && filterPriority !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.priority === filterPriority);
    }

    // Apply category filter
    if (filterCategory && filterCategory !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.category === filterCategory);
    }

    // Apply sorting
    if (sortBy === 'dueDate') {
      filteredTasks.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    return filteredTasks;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>To-Do List</Text>
      
      {/* Search and Filter Section */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#888"
        />
        <View style={styles.filterContainer}>
          {Platform.OS === 'web' ? (
            <>
              <View style={styles.webFilterButton} className="web-filter-button">
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={(e) => handleDropdownClick(e, 'sort')}>
                  <MaterialIcons name="sort" size={20} color="#666" />
                  <Text style={styles.filterText}>
                    {sortBy === 'none' ? 'Sort' : sortBy === 'dueDate' ? 'Due Date' : 'Priority'}
                  </Text>
                </TouchableOpacity>
                {showSortMenu && (
                  <View style={styles.webDropdownMenu} className="web-dropdown-menu">
                    <TouchableOpacity
                      style={[styles.webDropdownItem, sortBy === 'none' && styles.selectedItem]}
                      onPress={(e) => handleDropdownSelect(e, 'sort', 'none')}>
                      <Text style={[styles.dropdownText, sortBy === 'none' && styles.selectedText]}>
                        None
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.webDropdownItem, sortBy === 'dueDate' && styles.selectedItem]}
                      onPress={(e) => handleDropdownSelect(e, 'sort', 'dueDate')}>
                      <Text style={[styles.dropdownText, sortBy === 'dueDate' && styles.selectedText]}>
                        Due Date
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.webDropdownItem, sortBy === 'priority' && styles.selectedItem]}
                      onPress={(e) => handleDropdownSelect(e, 'sort', 'priority')}>
                      <Text style={[styles.dropdownText, sortBy === 'priority' && styles.selectedText]}>
                        Priority
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              <View style={styles.webFilterButton} className="web-filter-button">
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={(e) => handleDropdownClick(e, 'priority')}>
                  <MaterialIcons name="filter-list" size={20} color="#666" />
                  <Text style={styles.filterText}>
                    {filterPriority === 'all' ? 'Priority' : filterPriority.charAt(0).toUpperCase() + filterPriority.slice(1)}
                  </Text>
                </TouchableOpacity>
                {showPriorityMenu && (
                  <View style={styles.webDropdownMenu} className="web-dropdown-menu">
                    <TouchableOpacity
                      style={[styles.webDropdownItem, filterPriority === 'all' && styles.selectedItem]}
                      onPress={(e) => handleDropdownSelect(e, 'priority', 'all')}>
                      <Text style={[styles.dropdownText, filterPriority === 'all' && styles.selectedText]}>
                        All
                      </Text>
                    </TouchableOpacity>
                    {['low', 'medium', 'high'].map((p) => (
                      <TouchableOpacity
                        key={p}
                        style={[styles.webDropdownItem, filterPriority === p && styles.selectedItem]}
                        onPress={(e) => handleDropdownSelect(e, 'priority', p)}>
                        <Text style={[styles.dropdownText, filterPriority === p && styles.selectedText]}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.webFilterButton} className="web-filter-button">
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={(e) => handleDropdownClick(e, 'category')}>
                  <MaterialIcons name="category" size={20} color="#666" />
                  <Text style={styles.filterText}>
                    {filterCategory === 'all' ? 'Category' : filterCategory}
                  </Text>
                </TouchableOpacity>
                {showCategoryMenu && (
                  <View style={styles.webDropdownMenu} className="web-dropdown-menu">
                    <TouchableOpacity
                      style={[styles.webDropdownItem, filterCategory === 'all' && styles.selectedItem]}
                      onPress={(e) => handleDropdownSelect(e, 'category', 'all')}>
                      <Text style={[styles.dropdownText, filterCategory === 'all' && styles.selectedText]}>
                        All
                      </Text>
                    </TouchableOpacity>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[styles.webDropdownItem, filterCategory === category && styles.selectedItem]}
                        onPress={(e) => handleDropdownSelect(e, 'category', category)}>
                        <Text style={[styles.dropdownText, filterCategory === category && styles.selectedText]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.filterButton, { minWidth: 40 }]}
                onPress={() => {
                  Alert.alert(
                    'Sort By',
                    'Choose sorting option',
                    [
                      { text: 'None', onPress: () => setSortBy('none') },
                      { text: 'Due Date', onPress: () => setSortBy('dueDate') },
                      { text: 'Priority', onPress: () => setSortBy('priority') },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}>
                <MaterialIcons name="sort" size={20} color="#666" />
                <Text style={styles.filterText}>
                  {sortBy === 'none' ? 'Sort' : sortBy === 'dueDate' ? 'Due Date' : 'Priority'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, { minWidth: 40 }]}
                onPress={() => {
                  Alert.alert(
                    'Filter Priority',
                    'Choose priority level',
                    [
                      { text: 'All', onPress: () => setFilterPriority('all') },
                      { text: 'Low', onPress: () => setFilterPriority('low') },
                      { text: 'Medium', onPress: () => setFilterPriority('medium') },
                      { text: 'High', onPress: () => setFilterPriority('high') },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}>
                <MaterialIcons name="filter-list" size={20} color="#666" />
                <Text style={styles.filterText}>
                  {filterPriority === 'all' ? 'Priority' : filterPriority.charAt(0).toUpperCase() + filterPriority.slice(1)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, { minWidth: 40 }]}
                onPress={() => {
                  Alert.alert(
                    'Filter Category',
                    'Choose category',
                    [
                      { text: 'All', onPress: () => setFilterCategory('all') },
                      ...categories.map((category) => ({
                        text: category,
                        onPress: () => setFilterCategory(category)
                      })),
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}>
                <MaterialIcons name="category" size={20} color="#666" />
                <Text style={styles.filterText}>
                  {filterCategory === 'all' ? 'Category' : filterCategory}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your task"
          value={taskTitle}
          onChangeText={setTaskTitle}
        />

        {/* Category Selection */}
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>Category:</Text>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  { backgroundColor: selectedCategory === item ? '#4CAF50' : '#ddd' },
                ]}
                onPress={() => setSelectedCategory(item)}>
                <Text
                  style={[
                    styles.categoryButtonText,
                    { color: selectedCategory === item ? '#fff' : '#333' },
                  ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Priority Selection */}
        <View style={styles.priorityContainer}>
          <Text style={styles.priorityLabel}>Priority:</Text>
          <View style={styles.priorityButtons}>
            {(['low', 'medium', 'high']).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  { backgroundColor: priority === p ? getPriorityColor(p) : '#ddd' },
                ]}
                onPress={() => setPriority(p)}>
                <Text style={[styles.priorityButtonText, { color: priority === p ? '#fff' : '#333' }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Due Date Selection */}
        {Platform.OS === 'web' ? (
          <View style={styles.dateButton}>
            <MaterialIcons name="calendar-today" size={20} color="#666" />
            <input
              type="date"
              style={{
                marginLeft: 8,
                fontSize: 14,
                color: '#666',
                flex: 1,
                height: 20,
                padding: 0,
                border: 'none',
                backgroundColor: 'transparent',
              }}
              value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setSelectedDate(date);
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}>
              <MaterialIcons name="calendar-today" size={20} color="#666" />
              <Text style={styles.dateButtonText}>
                {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Set Due Date'}
              </Text>
            </TouchableOpacity>

            {Platform.OS !== 'web' && showDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                value={selectedDate || new Date()}
                mode="date"
                display={Platform.OS === 'android' ? 'default' : 'spinner'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (event.type !== 'dismissed' && selectedDate) {
                    setSelectedDate(selectedDate);
                  }
                }}
                minimumDate={new Date()}
              />
            )}
          </>
        )}

        {/* Button to add the task */}
        <TouchableOpacity style={styles.button} onPress={addTaskHandler}>
          <Text style={styles.buttonText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      <FlatList
        style={styles.list}
        data={getFilteredAndSortedTasks()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.taskItem, { borderLeftColor: getPriorityColor(item.priority) }]}
            onLongPress={() => editTask(item)}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => toggleTaskCompletion(item.id)}>
              <MaterialIcons
                name={item.completed ? 'check-box' : 'check-box-outline-blank'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
            <View style={styles.taskContent}>
              <Text
                style={[
                  styles.taskText,
                  item.completed && styles.completedTaskText,
                ]}>
                {item.title}
              </Text>
              <View style={styles.taskDetails}>
                <Text style={styles.categoryTag}>{item.category}</Text>
                {item.dueDate && (
                  <Text style={styles.dueDate}>
                    Due: {format(item.dueDate, 'MMM dd, yyyy')}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteTaskHandler(item.id)}>
              <MaterialIcons name="delete-outline" size={24} color="#F44336" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tasks found</Text>
        }
      />

      {/* Edit Task Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Task</Text>
            <TextInput
              style={styles.input}
              placeholder="Task title"
              value={taskTitle}
              onChangeText={setTaskTitle}
            />
            {/* ... Copy Priority, Date, and Category selection from main view ... */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                onPress={saveEditedTask}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    ...(Platform.OS === 'web' ? {
      height: '100vh',
      overflow: 'hidden',
    } : {}),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: '#4CAF50',
    padding: 15,
    textAlign: 'left',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    zIndex: Platform.OS === 'web' ? 2 : 1,
    ...Platform.select({
      android: {
        elevation: 3,
      },
    }),
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
    zIndex: Platform.OS === 'web' ? 3 : 1,
  },
  webFilterButton: {
    position: 'relative',
    zIndex: 1000,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    gap: 4,
    zIndex: Platform.OS === 'web' ? 101 : 1,
    minWidth: 40,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      web: {
        cursor: 'pointer',
      },
    }),
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  webDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
    ...(Platform.OS === 'web' ? {
      position: 'absolute',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    } : {}),
  },
  webDropdownItem: {
    padding: 8,
    borderRadius: 4,
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  selectedText: {
    color: '#1976d2',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  input: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  checkbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    marginBottom: 4,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryTag: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 