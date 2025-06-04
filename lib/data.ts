// Mock data for the dashboard
export interface Project {
  id: string
  name: string
  description: string
  status: "active" | "on-hold" | "at-risk" | "completed"
  budget: number
  spent: number
  burnRate: number
  mandaysAllocated: number
  mandaysConsumed: number
  startDate: string
  endDate: string
  department: string
}

export const mockProjects: Project[] = [
  {
    id: "proj-001",
    name: "Website Redesign",
    description: "Complete overhaul of company website with new branding",
    status: "active",
    budget: 75000,
    spent: 45000,
    burnRate: 12.5,
    mandaysAllocated: 120,
    mandaysConsumed: 72,
    startDate: "2023-01-15",
    endDate: "2023-06-30",
    department: "Marketing",
  },
  {
    id: "proj-002",
    name: "CRM Implementation",
    description: "Implementation of new customer relationship management system",
    status: "at-risk",
    budget: 120000,
    spent: 95000,
    burnRate: 18.2,
    mandaysAllocated: 200,
    mandaysConsumed: 160,
    startDate: "2023-02-01",
    endDate: "2023-08-15",
    department: "Sales",
  },
  {
    id: "proj-003",
    name: "Mobile App Development",
    description: "Development of iOS and Android mobile applications",
    status: "on-hold",
    budget: 90000,
    spent: 40000,
    burnRate: 9.8,
    mandaysAllocated: 180,
    mandaysConsumed: 80,
    startDate: "2023-03-10",
    endDate: "2023-09-30",
    department: "Product",
  },
  {
    id: "proj-004",
    name: "Office Relocation",
    description: "Planning and execution of office move to new location",
    status: "completed",
    budget: 50000,
    spent: 48000,
    burnRate: 15.5,
    mandaysAllocated: 60,
    mandaysConsumed: 58,
    startDate: "2023-01-05",
    endDate: "2023-03-15",
    department: "Operations",
  },
  {
    id: "proj-005",
    name: "ERP System Upgrade",
    description: "Upgrade of enterprise resource planning system to latest version",
    status: "active",
    budget: 200000,
    spent: 80000,
    burnRate: 10.2,
    mandaysAllocated: 250,
    mandaysConsumed: 100,
    startDate: "2023-04-01",
    endDate: "2023-12-31",
    department: "IT",
  },
]

// Generate monthly manday data for charts
export function getMonthlyMandayData(projectId: string, year: string, projectsData: Project[] = mockProjects) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Generate random but consistent data for each project and month
  const generateMandaysForProject = (id: string, month: number) => {
    // Use the project ID and month to generate a consistent random number
    const seed = Number.parseInt(id.replace(/\D/g, "")) + month
    // Generate a value between 5 and 30
    return Math.floor((seed % 25) + 5)
  }

  if (projectId === "all") {
    // Sum mandays across all projects for each month
    return months.map((month, index) => ({
      month,
      mandays: projectsData.reduce((sum, project) => sum + generateMandaysForProject(project.id, index), 0),
    }))
  } else {
    // Get mandays for specific project
    return months.map((month, index) => ({
      month,
      mandays: generateMandaysForProject(projectId, index),
    }))
  }
}

// Get available years for the filter
export function getYears() {
  return ["2021", "2022", "2023", "2024"]
}

// Get available months for the filter
export function getMonths() {
  return [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]
}

// Role-based manday usage data
export interface RoleData {
  Role: string
  Month: string
  TotalDuration: number
}

// Sample role data as provided
const mockRoleData: RoleData[] = [
  {
    Role: "FE",
    Month: "04",
    TotalDuration: 7.33,
  },
  {
    Role: "BE",
    Month: "04",
    TotalDuration: 23.380000000000003,
  },
  {
    Role: "QA",
    Month: "04",
    TotalDuration: 14.5,
  },
  {
    Role: "PO",
    Month: "04",
    TotalDuration: 67.43,
  },
  {
    Role: "Mobile",
    Month: "04",
    TotalDuration: 14.5,
  },
]

// Additional mock data for other months and projects
const generateRoleData = () => {
  const roles = ["FE", "BE", "QA", "PO", "Mobile", "DevOps", "UI/UX"]
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
  const projects = mockProjects.map((p) => p.id)

  const allRoleData: Array<RoleData & { ProjectId?: string }> = []

  // Include the original data
  allRoleData.push(...mockRoleData.map((item) => ({ ...item, ProjectId: "proj-001" })))

  // Generate additional data for other months and projects
  projects.forEach((projectId) => {
    if (projectId === "proj-001") return // Skip the first project as we already have data

    months.forEach((month) => {
      // Only generate for a subset of roles to make the data more realistic
      const projectRoles = roles.slice(0, Math.floor(Math.random() * roles.length) + 3)

      projectRoles.forEach((role) => {
        // Generate a random duration between 5 and 80 hours
        const duration = +(Math.random() * 75 + 5).toFixed(2)

        allRoleData.push({
          Role: role,
          Month: month,
          TotalDuration: duration,
          ProjectId: projectId,
        })
      })
    })
  })

  return allRoleData
}

const allRoleData = generateRoleData()

// Get role data filtered by project and month
export function getRoleData(projectId: string, month: string) {
  if (projectId === "all") {
    // Sum durations across all projects for the selected month
    const filteredByMonth = allRoleData.filter((item) => item.Month === month)

    // Group by role and sum durations
    const roleMap = new Map<string, number>()

    filteredByMonth.forEach((item) => {
      const currentTotal = roleMap.get(item.Role) || 0
      roleMap.set(item.Role, currentTotal + item.TotalDuration)
    })

    // Convert map back to array
    return Array.from(roleMap.entries()).map(([role, totalDuration]) => ({
      Role: role,
      Month: month,
      TotalDuration: +totalDuration.toFixed(2),
    }))
  } else {
    // Filter by project and month
    return allRoleData
      .filter((item) => (item.ProjectId === projectId || !item.ProjectId) && item.Month === month)
      .map((item) => ({
        Role: item.Role,
        Month: item.Month,
        TotalDuration: item.TotalDuration,
      }))
  }
}
