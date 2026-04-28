export const CATEGORIES = ["Task", "Note", "Project", "Reference"];
export const PRIORITIES = ["High", "Medium", "Low", "None"];
export const STATUSES   = ["Open", "In Progress", "Done", "Archived"];
export const TYPES      = ["Digital", "Physical", "Work"];
export const TIMES      = ["5 min", "15 min", "1 hour", "2 hours", "4 hours", "Multi-day", "Year+"];

export const PRI_ORD  = { High: 0, Medium: 1, Low: 2, None: 3 };
export const TIME_ORD = { "5 min": 0, "15 min": 1, "1 hour": 2, "2 hours": 3, "4 hours": 4, "Multi-day": 5, "Year+": 6 };

export const ST_CLR  = { Open: "#e8c547", "In Progress": "#5bb8f5", Done: "#6dde9e", Archived: "#666" };
export const CAT_CLR = { Task: "#f5855b", Note: "#a78bfa", Project: "#5bb8f5", Reference: "#6dde9e" };
export const PRI_CLR = { High: "#ff6b6b", Medium: "#e8c547", Low: "#6dde9e", None: "#666" };
export const TYP_CLR = { Digital: "#5bb8f5", Physical: "#f5855b", Work: "#c084fc" };
export const TIM_CLR = { "5 min": "#6dde9e", "15 min": "#a8e6a3", "1 hour": "#e8c547", "2 hours": "#f5a55b", "4 hours": "#f5855b", "Multi-day": "#ff6b6b", "Year+": "#cc4444" };

export const GITHUB_DEFAULTS = {
  owner: "Aldebaran87dev",
  repo:  "aldebaran-docs",
  path:  "notebook.json",
};
