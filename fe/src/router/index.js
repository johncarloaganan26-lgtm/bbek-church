import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import DashboardView from '../components/Admin/DashboardView.vue'
// Church Records
import MemberRecord from '../components/Admin/ChurchRecords/MemberRecord.vue'
import ChurchLeaders from '../components/Admin/ChurchRecords/ChurchLeaders.vue'
import DepartmentOfficersAdmin from '../components/Admin/ChurchRecords/DepartmentOfficers.vue'
import EventsRecords from '../components/Admin/ChurchRecords/EventsRecords.vue'
import TithesOfferings from '../components/Admin/ChurchRecords/TithesOfferings.vue'
import Ministries from '../components/Admin/ChurchRecords/Ministries.vue'
import Departments from '../components/Admin/ChurchRecords/Departments.vue'
import Accounts from '../components/Admin/ChurchRecords/Accounts.vue'
import Approvals from '../components/Admin/ChurchRecords/Approvals.vue'
import Transactions from '../components/Admin/ChurchRecords/Transactions.vue'
// Services (Admin)
import WaterBaptismAdmin from '../components/Admin/ServicesRecords/WaterBaptism.vue'
import ChildDedicationAdmin from '../components/Admin/ServicesRecords/ChildDedication.vue'
import BurialServiceAdmin from '../components/Admin/ServicesRecords/BurialService.vue'
import MarriageRecordAdmin from '../components/Admin/ServicesRecords/MarriageRecord.vue'
// Communication
import Messages from '../components/Admin/CommunicationRecords/Messages.vue'
// Maintenance Pages
import ContentManagement from '../components/Admin/Maintenance/ContentManagementPage.vue'
import Archive from '../components/Admin/Maintenance/Archive.vue'
import Settings from '../components/Admin/Maintenance/Settings.vue'
import AuditTrail from '../components/Admin/Maintenance/AuditTrail.vue'
import SystemLogs from '../components/Admin/Maintenance/SystemLogs.vue'


// Landing Page Components
import New from '../components/LandingPage/New.vue'
import PlanYourVisit from '../components/LandingPage/PlanYourVisit.vue'
import Give from '../components/LandingPage/Give.vue'
import Live from '../components/LandingPage/Live.vue'
import MessagesPage from '../components/LandingPage/Messages.vue'
// BeOneOfUs Pages
import AcceptJesusChrist from '../components/LandingPage/BeOneOfUs/AcceptJesusChrist.vue'
import SendPrayer from '../components/LandingPage/BeOneOfUs/SendPrayer.vue'
// About Pages
import About from '../components/LandingPage/About/About.vue'
import AboutGrid from '../components/LandingPage/About/AboutGrid.vue'
import AboutUs from '../components/LandingPage/About/AboutUs.vue'
import Vision from '../components/LandingPage/About/Vision.vue'
import Mission from '../components/LandingPage/About/Mission.vue'
import Beliefs from '../components/LandingPage/About/Beliefs.vue'
import Leadership from '../components/LandingPage/About/Leadership.vue'
import LeadersAndOfficers from '../components/LandingPage/About/LeadersAndOfficers.vue'
import Officers from '../components/LandingPage/About/Officers.vue'
import DepartmentOfficersAbout from '../components/LandingPage/About/DepartmentOfficers.vue'
// Events Pages
import Event from '../components/LandingPage/Events/Event.vue'
import AllEvents from '../components/LandingPage/Events/AllEvents.vue'
import AllEventsOfUser from '../components/LandingPage/Events/AllEventsOfUser.vue'
import LearnMoreEvent from '../components/LandingPage/Events/LearnMoreEvent.vue'
import MyMinistry from '../components/LandingPage/Ministries/MyMinistry.vue'
// Ministries Pages
import Ministry from '../components/LandingPage/Ministries/Ministry.vue'
import AllMinistries from '../components/LandingPage/Ministries/AllMinistries.vue'
import MinistryData from '../components/LandingPage/Ministries/MinistryData.vue'
import LearnMoreMinistry from '../components/LandingPage/Ministries/LearnMoreMinistries.vue'

// Services Pages
import ServicesWrapper from '../components/LandingPage/Services/ServicesWrapper.vue'
import Services from '../components/LandingPage/Services/Services.vue'
import WaterBaptism from '../components/LandingPage/Services/WaterBaptism.vue'
import MarriageService from '../components/LandingPage/Services/MarriageService.vue'
import ChildDedication from '../components/LandingPage/Services/ChildDedication.vue'
import BurialService from '../components/LandingPage/Services/BurialService.vue'
// import MarriageService from '../components/LandingPage/Services/MarriageService.vue'


// PasswordManagement Pages
import PasswordManagement from '../components/PasswordManagement.vue'
// Certificate Preview
import CertificatePreview from '../views/CertificatePreview.vue'
// Not Found Page
import NotFound from '../views/NotFound.vue'
// Member Transaction
import Transaction from '../components/Transaction.vue'

import { checkAccessTokenValidity } from '@/utils/tokenValidation'

const routes = [
  {
    path: '/',
    name: 'LandingPage',
    component: LandingPage
  },
  {
    path: '/new',
    name: 'New',
    component: New
  },
  {
    path: '/schedule-change',
    name: 'ScheduleChange',
    component: () => import('../components/LandingPage/ScheduleChange.vue')
  },
  {
    path: '/plan-your-visit',
    name: 'PlanYourVisit',
    component: PlanYourVisit
  },
  {
    path: '/give',
    name: 'Give',
    component: Give
  },
  {
    path: '/events',
    component: Event,
    children: [
      {
        path: '',
        name: 'AllEvents',
        component: AllEvents
      },
      {
        path: 'all-events',
        name: 'AllEventsRoute',
        component: AllEvents
      },
      {
        path: 'my-events',
        name: 'AllEventsOfUser',
        component: AllEventsOfUser
      },
      // Accept encoded event object for events 
      //encodeURIComponent(JSON.stringify(event))
      {
        path: 'learn-more-event',
        query: { eventModel: encodeURIComponent(JSON.stringify(event)) },
        name: 'LearnMoreEvent',
        component: LearnMoreEvent
      },
    ]
  },
 
  {
    path: '/live',
    name: 'Live',
    component: Live
  },
  {
    path: '/ministries',
    component: Ministry,
    children: [
      {
        path: '',
        name: 'AllMinistries',
        component: AllMinistries
      },
      {
        path: 'my-ministry',
        name: 'MyMinistry',
        component: MyMinistry
      },
      {
        path: 'ministry-data',
        query: { ministryData: decodeURIComponent(event) },
        name: 'MinistryData',
        component: MinistryData
      },
      {
        path: 'ministry/:departmentId',
        name: 'MinistryByDepartment',
        component: AllMinistries
      },
      {
        path: 'learn-more-ministry/:id',
        name: 'LearnMoreMinistry',
        component: LearnMoreMinistry
      }
    ]
  },
  {
    path: '/messages',
    name: 'MessagesPage',
    component: MessagesPage
  },
  {
    path: '/beoneofus/accept-jesus',
    name: 'AcceptJesusChrist',
    component: AcceptJesusChrist
  },
  {
    path: '/beoneofus/send-prayer',
    name: 'SendPrayer',
    component: SendPrayer
  },
  {
    path: '/about',
    component: About,
    children: [
      {
        path: '',
        name: 'AboutGrid',
        component: AboutGrid
      },
      {
        path: 'aboutus',
        name: 'AboutUs',
        component: AboutUs
      },
      {
        path: 'beliefs',
        name: 'Beliefs',
        component: Beliefs
      },
      {
        path: 'churchleaders',
        name: 'Leadership',
        component: Leadership
      },
      {
        path: 'departmentofficer',
        name: 'DepartmentOfficersAbout',
        component: DepartmentOfficersAbout
      }
    ]
  },
  {
    path: '/services',
    component: ServicesWrapper,
    children: [
      {
        path: '',
        name: 'Services',
        component: Services
      },
      {
        path: 'water-baptism',
        name: 'WaterBaptismService',
        component: WaterBaptism
      },
      {
        path: 'burial-service',
        name: 'BurialServicePage',
        component: BurialService
      },
      {
        path: 'marriage-service',
        name: 'MarriageService',
        component: MarriageService
      },
      {
        path: 'child-dedication',
        name: 'ChildDedication',
        component: ChildDedication
      }
    ]
  },
  // {
  //   path: '/services/marriage-service',
  //   name: 'MarriageService',
  //   component: MarriageService
  // },
  // Removed conflicting route - using nested routes instead
  // {
  //   path: '/services/:serviceId',
  //   component: Services,
  // },
  {
    path: '/admin',
    component: AdminDashboard,
    name: 'AdminDashboard',
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardView
      },
      {
        path: 'members',
        name: 'MemberRecord',
        component: MemberRecord
      },
      {
        path: 'leaders',
        name: 'ChurchLeaders',
        component: ChurchLeaders
      },
      {
        path: 'officers',
        name: 'DepartmentOfficers',
        component: DepartmentOfficersAdmin
      },
      {
        path: 'events',
        name: 'EventsRecords',
        component: EventsRecords
      },
      {
        path: 'tithes-offerings',
        name: 'TithesOfferings',
        component: TithesOfferings
      },
      {
        path: 'ministries',
        name: 'Ministries',
        component: Ministries
      },
      {
        path: 'departments',
        name: 'Departments',
        component: Departments
      },
      {
        path: 'water-baptism',
        name: 'WaterBaptism',
        component: WaterBaptismAdmin
      },
      {
        path: 'child-dedication-admin',
        name: 'ChildDedicationAdmin',
        component: ChildDedicationAdmin
      },
      {
        path: 'burial-service',
        name: 'BurialService',
        component: BurialServiceAdmin
      },
      {
        path: 'marriage-service-admin',
        name: 'MarriageServiceAdmin',
        component: MarriageRecordAdmin
      },
      {
        path: 'messages',
        name: 'Messages',
        component: Messages
      },
      {
        path: 'content-management',
        name: 'ContentManagement',
        component: ContentManagement
      },
      {
        path: 'archive',
        name: 'Archive',
        component: Archive
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings
      },
      {
        path: 'audit-trail',
        name: 'AuditTrail',
        component: AuditTrail
      },
      {
        path: 'system-logs',
        name: 'SystemLogs',
        component: SystemLogs
      },
      {
        path: 'accounts',
        name: 'Accounts',
        component: Accounts
      },
      {
        path: 'approvals',
        name: 'Approvals',
        component: Approvals
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: Transactions
      }
    ]
  },
  {
    path: '/change-password/:isProfileChange/:acc_id',
    name: 'PasswordManagement',
    component: PasswordManagement
  },
  {
    path: '/change-password/:acc_id',
    name: 'PasswordManagementFromEmail',
    component: PasswordManagement
  },
  {
    path: '/preview/certificate/:type?',
    name: 'CertificatePreview',
    component: CertificatePreview,
    props: true
  },
  {
    path: '/landpage/transactions',
    name: 'MemberTransactions',
    component: Transaction
  },
  // Catch-all route for 404 - must be last
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  // Get userInfo and accessToken from localStorage
  const userInfoStr = localStorage.getItem('userInfo')
  const accessToken = localStorage.getItem('accessToken')

  // Parse userInfo if it exists
  let userInfo = null
  if (userInfoStr) {
    try {
      userInfo = JSON.parse(userInfoStr)
    } catch (error) {
      console.error('Error parsing userInfo:', error)
    }
  }
  
  // Check if userInfo or accessToken is null
  const isAuthenticated = userInfo || accessToken
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    'LandingPage',
    'New',
    'PlanYourVisit',
    'Give',
    'AllEvents',
    'AllEventsRoute',
    'AllEventsOfUser',
    'LearnMoreEvent',
    'Live',
    'Ministry',
    'AllMinistries',
    'MinistryData',
    'MinistryByDepartment',
    'LearnMoreMinistry',
    'MessagesPage',
    'AcceptJesusChrist',
    'SendPrayer',
    'AboutGrid',
    'AboutUs',
    'Beliefs',
    'Leadership',
    'DepartmentOfficersAbout',
    'Services',
    'WaterBaptismService',
    'BurialServicePage',
    'MarriageService',
    'ChildDedication',
    'PasswordManagement',
    'PasswordManagementFromEmail',
    'CertificatePreview',
  ]
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(to.name)
  
  // Check if trying to access admin routes
  const isAdminRoute = to.path.startsWith('/admin')
  
  // If trying to access admin routes
  if (isAdminRoute) {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to LandingPage if not authenticated
      next({ name: 'LandingPage' })
      return
    }
    
    // Check if user has admin or staff position
    const userPosition = userInfo?.account?.position
    const hasAdminAccess = userPosition === 'admin' || userPosition === 'staff'
    
    if (!hasAdminAccess) {
      // Redirect to LandingPage if user doesn't have admin/staff access
      next({ name: 'LandingPage' })
      return
    }
  }
  
  // If trying to access a protected route without authentication
  if (!isAuthenticated && !isPublicRoute) {
    // Redirect to LandingPage
    next({ name: 'LandingPage' })
  } else {
    // Allow navigation
    next()
  }
})

export default router

