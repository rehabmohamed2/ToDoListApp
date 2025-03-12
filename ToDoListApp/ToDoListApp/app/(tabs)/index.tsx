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
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the Task interface
interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate: Date | null;
  category: string;
}

// Available categories
const categories = ['Personal', 'Work', 'Shopping', 'Health', 'Other'];

export default function ToDoList() {
  const [taskTitle, setTaskTitle] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('Personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'low' | 'medium' | 'high' | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'none'>('none');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load tasks from AsyncStorage on mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Save tasks to AsyncStorage whenever they change
  useEffect(() => {
    saveTasks();
  }, [tasks]);

  // Load tasks from AsyncStorage
  const loadTasks = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem('tasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        // Convert date strings back to Date objects
        parsedTasks.forEach((task: Task) => {
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

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle,
      completed: false,
      priority,
      dueDate: selectedDate,
      category: selectedCategory,
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);
    setTaskTitle('');
    setPriority('medium');
    setSelectedDate(null);
    setSelectedCategory('Personal');
  };

  // Function to edit task
  const editTask = (task: Task) => {
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
    setTaskTitle('');
    setPriority('medium');
    setSelectedDate(null);
    setSelectedCategory('Personal');
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
        return a.dueDate.getTime() - b.dueDate.getTime();
      });
    } else if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    return filteredTasks;
  };

  // Function to delete a task
  const deleteTaskHandler = (taskId: string) => {
    if (Platform.OS === 'web') {
      // For web, delete immediately without confirmation
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    } else {
      // For mobile, show confirmation dialog
      Alert.alert(
        'Delete Task',
        'Are you sure you want to delete this task?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
            },
          },
        ]
      );
    }
  };

  // Function to toggle task completion
  const toggleTaskCompletion = (taskId: string) => {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Function to handle date change
  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (event.type !== 'dismissed' && date) {
      setSelectedDate(date);
    }
  };

  // Function to get priority color
  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FFA000';
      case 'high':
        return '#F44336';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
        {/* TextInput for adding tasks */}
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
            {(['low', 'medium', 'high'] as const).map((p) => (
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
                const date = new Date(e.target.value);
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

            {/* Show date picker for mobile */}
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                onChange={onDateChange}
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
  },
  inputContainer: {
    padding: 20,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  priorityContainer: {
    marginBottom: 10,
  },
  priorityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
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
    marginBottom: 10,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
  dueDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
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
  categoryContainer: {
    marginBottom: 10,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
  taskDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
