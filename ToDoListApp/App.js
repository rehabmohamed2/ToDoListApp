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

  // Load tasks from AsyncStorage on mount
  useEffect(() => {
    const loadTasksEffect = async () => {
      await loadTasks();
    };
    loadTasksEffect();
  }, []);

  // Save tasks to AsyncStorage whenever they change
  useEffect(() => {
    const saveTasksEffect = async () => {
      await saveTasks();
    };
    saveTasksEffect();
  }, [tasks]);

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

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filteredTasks = tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesCategory = filterCategory === 'all' || task.category === filterCategory;
      return matchesSearch && matchesPriority && matchesCategory;
    });

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

  // Date picker component
  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <TouchableOpacity style={styles.dateButton}>
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
            value={selectedDate ? format(new Date(selectedDate), 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              const date = new Date(e.target.value);
              setSelectedDate(date);
            }}
            min={format(new Date(), 'yyyy-MM-dd')}
          />
        </TouchableOpacity>
      );
    }

    return (
      <>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}>
          <MaterialIcons name="calendar-today" size={20} color="#666" />
          <Text style={styles.dateButtonText}>
            {selectedDate ? format(new Date(selectedDate), 'MMM dd, yyyy') : 'Set Due Date'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (event.type !== 'dismissed' && date) {
                setSelectedDate(date);
              }
            }}
            minimumDate={new Date()}
          />
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>To-Do List</Text>
      
      {/* Search and Filter Section - Moved to top */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#888"
        />
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Alert.alert(
                'Sort By',
                'Choose sorting option',
                [
                  { text: 'None', onPress: () => setSortBy('none') },
                  { text: 'Due Date', onPress: () => setSortBy('dueDate') },
                  { text: 'Priority', onPress: () => setSortBy('priority') },
                ]
              );
            }}>
            <MaterialIcons name="sort" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Alert.alert(
                'Filter Priority',
                'Choose priority level',
                [
                  { text: 'All', onPress: () => setFilterPriority('all') },
                  { text: 'High', onPress: () => setFilterPriority('high') },
                  { text: 'Medium', onPress: () => setFilterPriority('medium') },
                  { text: 'Low', onPress: () => setFilterPriority('low') },
                ]
              );
            }}>
            <MaterialIcons name="filter-list" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your task"
          value={taskTitle}
          onChangeText={setTaskTitle}
          placeholderTextColor="#888"
        />

        {/* Category Selection */}
        <View style={styles.categoryContainer}>
          <Text style={styles.categoryLabel}>Category:</Text>
          <View style={styles.categoryButtonsContainer}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item}
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
            ))}
          </View>
        </View>

        {/* Priority Selection */}
        <View style={styles.priorityContainer}>
          <Text style={styles.priorityLabel}>Priority:</Text>
          <View style={styles.priorityButtons}>
            {['low', 'medium', 'high'].map((p) => (
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
        {renderDatePicker()}

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
                color="#4CAF50"
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
                    Due: {format(new Date(item.dueDate), 'MMM dd, yyyy')}
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
            
            {/* Category Selection */}
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryLabel}>Category:</Text>
              <View style={styles.categoryButtonsContainer}>
                {categories.map((item) => (
                  <TouchableOpacity
                    key={item}
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
                ))}
              </View>
            </View>

            {/* Priority Selection */}
            <View style={styles.priorityContainer}>
              <Text style={styles.priorityLabel}>Priority:</Text>
              <View style={styles.priorityButtons}>
                {['low', 'medium', 'high'].map((p) => (
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
            {renderDatePicker()}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#F44336' }]}
                onPress={() => {
                  setShowEditModal(false);
                  resetForm();
                }}>
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
    padding: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  inputContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  categoryContainer: {
    marginBottom: 15,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  categoryButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priorityContainer: {
    marginBottom: 15,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
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
    padding: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    borderLeftWidth: 4,
  },
  checkbox: {
    marginRight: 10,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#333',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryTag: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  dueDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 