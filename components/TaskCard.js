
import React from "react";
import { View, Text, Pressable } from "react-native";

const TaskCard = ({
  task,
  styles,
  onToggle,
  onEdit,
  onDelete,
}) => {
  return (
    <View
      style={[
        styles.taskCard,
        task.completed && styles.completedTaskCard,
      ]}
    >
      <Pressable
        style={styles.taskInfo}
        onPress={() => onToggle(task.id)}
      >
        <View style={styles.taskTitleRow}>
          <View
            style={[
              styles.taskCheckbox,
              task.completed && styles.checkedCheckbox,
            ]}
          >
            {task.completed && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>

          <Text
            numberOfLines={2}
            style={[
              styles.taskTitle,
              task.completed && styles.completedText,
            ]}
          >
            {task.title}
          </Text>
        </View>

        <Text style={styles.taskTime}>
          🕒 {task.time || "No time set"}
        </Text>

        {task.dueDate && (
          <Text style={styles.dueDateText}>
            📅{" "}
            {new Date(task.dueDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        )}

        {task.dueDate &&
          !task.completed &&
          new Date(task.dueDate) < new Date() && (
            <Text style={styles.overdueText}>
              ⚠️ Overdue
            </Text>
          )}

        {task.completed && task.completedAt && (
          <Text style={styles.completedAtText}>
            ✓ Completed on{" "}
            {new Date(task.completedAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </Text>
        )}
      </Pressable>

      <View style={styles.taskActions}>
        <Text
          style={[
            styles.priority,
            task.priority === "High" && styles.highPriority,
            task.priority === "Medium" && styles.mediumPriority,
            task.priority === "Low" && styles.lowPriority,
          ]}
        >
          {task.priority}
        </Text>

        <View style={styles.actionButtons}>
          <Pressable
            onPress={() => onEdit(task.id)}
            style={styles.editButton}
          >
            <Text style={styles.editText}>✎</Text>
          </Pressable>

          <Pressable
            onPress={() => onDelete(task.id)}
            style={styles.deleteButton}
          >
            <Text style={styles.deleteText}>×</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default TaskCard;
