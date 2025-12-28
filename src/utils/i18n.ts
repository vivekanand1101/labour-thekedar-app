import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Language = 'en' | 'hi';

const translations = {
  en: {
    // App
    appName: 'Labour Thekedar',
    appTagline: 'Manage your labour attendance and payments',

    // Auth
    enterPhone: 'Enter your phone number',
    phoneNumber: 'Phone Number',
    continue: 'Continue',
    otpHint: 'We\'ll send you an OTP to verify your number',
    verifyPhone: 'Verify your phone',
    otpSentTo: 'OTP sent to',
    enterOtp: 'Enter OTP',
    yourName: 'Your Name',
    verifyAndContinue: 'Verify & Continue',
    demoHint: 'For demo, enter any 6-digit code',
    invalidOtp: 'Invalid OTP. Please try again.',
    validPhone: 'Please enter a valid 10-digit phone number',
    enter6DigitOtp: 'Please enter a 6-digit OTP',
    enterName: 'Please enter your name',

    // Projects
    myProjects: 'My Projects',
    welcome: 'Welcome',
    noProjectsYet: 'No projects yet',
    createFirstProject: 'Create your first project to start tracking',
    newProject: 'New Project',
    projectName: 'Project Name',
    description: 'Description (optional)',
    createProject: 'Create Project',
    createProjectHint: 'Create a new project to organize your labourers',
    deleteProject: 'Delete Project',
    deleteProjectConfirm: 'Are you sure? This will delete all labourers, attendance and payments.',
    labourers: 'Labourers',
    pendingDues: 'Pending Dues',

    // Labour
    addLabour: 'Add Labour',
    labourName: 'Name',
    phone: 'Phone (optional)',
    dailyWage: 'Daily Wage',
    addLabourHint: 'Add a new labourer to this project',
    noLabourersYet: 'No labourers yet',
    addLabourersHint: 'Add labourers to start tracking',
    daysWorked: 'Days Worked',
    totalEarned: 'Total Earned',
    totalPaid: 'Total Paid',
    balanceDue: 'Balance Due',
    balance: 'Balance',
    cleared: 'Cleared',
    overpaid: 'Overpaid',
    deleteLabour: 'Delete Labour',
    deleteLabourConfirm: 'Are you sure? This will delete all attendance and payment records.',
    editLabour: 'Edit Labour',
    perDay: '/ day',

    // Attendance
    addAttendance: 'Add Attendance',
    markAttendance: 'Mark Attendance',
    date: 'Date',
    workType: 'Work Type',
    fullDay: 'Full Day',
    halfDay: 'Half Day',
    attendanceExists: 'Attendance already marked. Saving will update it.',
    amountEarned: 'Amount to be earned',
    updateAttendance: 'Update Attendance',
    selectLabourers: 'Select labourers who worked on this date',
    selectAll: 'Select All',
    selected: 'selected',
    saveAttendance: 'Save Attendance',
    noLabourersInProject: 'No labourers in this project yet',

    // Payment
    addPayment: 'Add Payment',
    amount: 'Amount',
    amountPlaceholder: 'Enter amount',
    notes: 'Notes (optional)',
    currentBalance: 'Current Balance',
    payment: 'Payment',
    validAmount: 'Please enter a valid amount',
    paymentFailed: 'Failed to add payment. Please try again.',

    // Events
    events: 'Events',
    records: 'records',
    noEventsYet: 'No events yet',

    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    loading: 'Loading...',
    logout: 'Logout',
    of: 'of',
  },
  hi: {
    // App
    appName: 'लेबर ठेकेदार',
    appTagline: 'मजदूरों की हाजिरी और भुगतान का हिसाब रखें',

    // Auth
    enterPhone: 'अपना फोन नंबर डालें',
    phoneNumber: 'फोन नंबर',
    continue: 'आगे बढ़ें',
    otpHint: 'हम आपको OTP भेजेंगे',
    verifyPhone: 'फोन वेरीफाई करें',
    otpSentTo: 'OTP भेजा गया',
    enterOtp: 'OTP डालें',
    yourName: 'आपका नाम',
    verifyAndContinue: 'वेरीफाई करें',
    demoHint: 'डेमो के लिए कोई भी 6 अंक डालें',
    invalidOtp: 'गलत OTP। फिर से कोशिश करें।',
    validPhone: 'सही 10 अंकों का नंबर डालें',
    enter6DigitOtp: '6 अंकों का OTP डालें',
    enterName: 'कृपया अपना नाम डालें',

    // Projects
    myProjects: 'मेरे प्रोजेक्ट',
    welcome: 'नमस्ते',
    noProjectsYet: 'कोई प्रोजेक्ट नहीं',
    createFirstProject: 'हिसाब रखने के लिए पहला प्रोजेक्ट बनाएं',
    newProject: 'नया प्रोजेक्ट',
    projectName: 'प्रोजेक्ट का नाम',
    description: 'विवरण (वैकल्पिक)',
    createProject: 'प्रोजेक्ट बनाएं',
    createProjectHint: 'मजदूरों को व्यवस्थित करने के लिए नया प्रोजेक्ट बनाएं',
    deleteProject: 'प्रोजेक्ट हटाएं',
    deleteProjectConfirm: 'क्या आप सुनिश्चित हैं? सभी मजदूर, हाजिरी और भुगतान हट जाएंगे।',
    labourers: 'मजदूर',
    pendingDues: 'बकाया',

    // Labour
    addLabour: 'मजदूर जोड़ें',
    labourName: 'नाम',
    phone: 'फोन (वैकल्पिक)',
    dailyWage: 'दैनिक मजदूरी',
    addLabourHint: 'इस प्रोजेक्ट में नया मजदूर जोड़ें',
    noLabourersYet: 'कोई मजदूर नहीं',
    addLabourersHint: 'हिसाब रखने के लिए मजदूर जोड़ें',
    daysWorked: 'काम के दिन',
    totalEarned: 'कुल कमाई',
    totalPaid: 'कुल भुगतान',
    balanceDue: 'बकाया राशि',
    balance: 'बैलेंस',
    cleared: 'चुकता',
    overpaid: 'ज्यादा दिया',
    deleteLabour: 'मजदूर हटाएं',
    deleteLabourConfirm: 'क्या आप सुनिश्चित हैं? सभी हाजिरी और भुगतान हट जाएंगे।',
    editLabour: 'मजदूर संपादित करें',
    perDay: '/ दिन',

    // Attendance
    addAttendance: 'हाजिरी जोड़ें',
    markAttendance: 'हाजिरी लगाएं',
    date: 'तारीख',
    workType: 'काम का प्रकार',
    fullDay: 'पूरा दिन',
    halfDay: 'आधा दिन',
    attendanceExists: 'हाजिरी पहले से है। सेव करने पर अपडेट होगी।',
    amountEarned: 'कमाई की राशि',
    updateAttendance: 'हाजिरी अपडेट करें',
    selectLabourers: 'इस तारीख को काम करने वाले मजदूर चुनें',
    selectAll: 'सभी चुनें',
    selected: 'चुने गए',
    saveAttendance: 'हाजिरी सेव करें',
    noLabourersInProject: 'इस प्रोजेक्ट में कोई मजदूर नहीं',

    // Payment
    addPayment: 'भुगतान जोड़ें',
    amount: 'राशि',
    amountPlaceholder: 'राशि डालें',
    notes: 'नोट (वैकल्पिक)',
    currentBalance: 'वर्तमान बकाया',
    payment: 'भुगतान',
    validAmount: 'सही राशि डालें',
    paymentFailed: 'भुगतान जोड़ने में विफल। फिर से कोशिश करें।',

    // Events
    events: 'इतिहास',
    records: 'रिकॉर्ड',
    noEventsYet: 'कोई रिकॉर्ड नहीं',

    // Common
    save: 'सेव करें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    loading: 'लोड हो रहा है...',
    logout: 'लॉग आउट',
    of: 'में से',
  },
};

type TranslationKey = keyof typeof translations.en;

interface I18nState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

export const useI18n = create<I18nState>()(
  persist(
    (set, get) => ({
      language: 'hi', // Default to Hindi
      setLanguage: (language) => set({ language }),
      t: (key) => {
        const { language } = get();
        return translations[language][key] || translations.en[key] || key;
      },
    }),
    {
      name: 'i18n-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }),
    }
  )
);
