
// Filter tasks by search, status and priority
export const filterTasks = (
  tasks,
  searchText,
  filterStatus,
  filterPriority
) => {
  return tasks.filter((task) => {
    const matchesSearch = (task.title || "")
      .toLowerCase()
      .includes(searchText.toLowerCase());

    const matchesStatus =
      filterStatus === "All" ||
      (filterStatus === "Completed" && task.completed) ||
      (filterStatus === "Pending" && !task.completed);

    const matchesPriority =
      filterPriority === "All" ||
      task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });
};

// Sort filtered tasks
export const sortTasks = (filteredTasks, sortBy) => {
  return [...filteredTasks].sort((a, b) => {
    if (sortBy === "Due Date") {
      const dateA = a.dueDate
        ? new Date(a.dueDate).getTime()
        : Infinity;

      const dateB = b.dueDate
        ? new Date(b.dueDate).getTime()
        : Infinity;

      return dateA - dateB;
    }

    if (sortBy === "Priority") {
      const priorityOrder = {
        High: 1,
        Medium: 2,
        Low: 3,
      };

      return (
        (priorityOrder[a.priority] ?? 4) -
        (priorityOrder[b.priority] ?? 4)
      );
    }

    if (sortBy === "Newest First") {
      return Number(b.id) - Number(a.id);
    }

    return 0;
  });
};
