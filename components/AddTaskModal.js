
import React from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

const AddTaskModal = ({
  styles,
  modalVisible,
  setModalVisible,
  taskTitle,
  setTaskTitle,
  priority,
  setPriority,
  selectedDate,
  selectedTime,
  showDatePicker,
  setShowDatePicker,
  showTimePicker,
  setShowTimePicker,
  handleDateChange,
  handleTimeChange,
  editingTaskId,
   setEditingTaskId,
  updateTask,
  addTask,
}) => {
  const handleCancel = () => {
    setModalVisible(false);
    setTaskTitle("");
    setPriority("Medium");
    setEditingTaskId(null);
  };

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Create New Task</Text>

          <Text style={styles.inputLabel}>Task Title</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your task"
            value={taskTitle}
            onChangeText={setTaskTitle}
          />

          <Text style={styles.inputLabel}>Select Priority</Text>

          <View style={styles.priorityOptions}>
            {["Low", "Medium", "High"].map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.priorityOption,
                  priority === item && styles.selectedPriority,
                ]}
                onPress={() => setPriority(item)}
              >
                <Text
                  style={[
                    styles.priorityOptionText,
                    priority === item && styles.selectedPriorityText,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.inputLabel}>Select Due Date</Text>

          <Pressable
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              📅 {selectedDate.toLocaleDateString()}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={handleDateChange}
            />
          )}

          <Text style={styles.inputLabel}>Select Reminder Time</Text>

          <Pressable
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              🕒{" "}
              {selectedTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </Pressable>

          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="clock"
              is24Hour={false}
              onChange={handleTimeChange}
            />
          )}

          <Pressable
            style={styles.saveButton}
            onPress={editingTaskId ? updateTask : addTask}
          >
            <Text style={styles.addButtonText}>
              {editingTaskId ? "Update Task" : "Save Task"}
            </Text>
          </Pressable>

          <Pressable onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default AddTaskModal;
