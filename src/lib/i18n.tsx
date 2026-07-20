/**
 * i18n Configuration — Issue #26: Multi-Language i18n
 *
 * Internationalization support for LYC Intelligence Platform.
 * Supports: English (en), Chinese (zh), Japanese (ja)
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Supported locales
export type Locale = 'en' | 'zh' | 'ja';

// Translation strings
const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Common
    'app.name': 'LYC Intelligence',
    'app.tagline': 'Executive Search & Leadership Intelligence',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.view': 'View',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.submit': 'Submit',
    'common.confirm': 'Confirm',
    'common.close': 'Close',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.mandates': 'Mandates',
    'nav.pipeline': 'Pipeline',
    'nav.candidates': 'Candidates',
    'nav.companies': 'Companies',
    'nav.intelligence': 'Intelligence',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.logout': 'Log out',

    // Auth
    'auth.login': 'Log in',
    'auth.signup': 'Sign up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.forgot_password': 'Forgot password?',
    'auth.reset_password': 'Reset Password',
    'auth.login_title': 'Welcome back',
    'auth.signup_title': 'Create your account',

    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.active_mandates': 'Active Mandates',
    'dashboard.candidates_in_pipeline': 'Candidates in Pipeline',
    'dashboard.interviews_today': 'Interviews Today',
    'dashboard.recent_activity': 'Recent Activity',

    // Mandates
    'mandates.title': 'Mandates',
    'mandates.active': 'Active',
    'mandates.completed': 'Completed',
    'mandates.paused': 'Paused',
    'mandates.new_mandate': 'New Mandate',
    'mandates.edit_mandate': 'Edit Mandate',
    'mandates.client': 'Client',
    'mandates.role': 'Role',
    'mandates.status': 'Status',
    'mandates.priority': 'Priority',
    'mandates.target_close': 'Target Close',
    'mandates.created': 'Created',
    'mandates.candidates': 'Candidates',

    // Candidates
    'candidates.title': 'Candidates',
    'candidates.profile': 'Profile',
    'candidates.experience': 'Experience',
    'candidates.education': 'Education',
    'candidates.skills': 'Skills',
    'candidates.current_company': 'Current Company',
    'candidates.current_title': 'Current Title',
    'candidates.location': 'Location',
    'candidates.availability': 'Availability',
    'candidates.add_to_pipeline': 'Add to Pipeline',
    'candidates.shortlist': 'Shortlist',
    'candidates.reject': 'Reject',

    // Interviews
    'interviews.title': 'Interviews',
    'interviews.scheduled': 'Scheduled',
    'interviews.completed': 'Completed',
    'interviews.cancelled': 'Cancelled',
    'interviews.reschedule': 'Reschedule',
    'interviews.confirm': 'Confirm Interview',

    // Messages
    'messages.title': 'Messages',
    'messages.inbox': 'Inbox',
    'messages.sent': 'Sent',
    'messages.archive': 'Archive',
    'messages.compose': 'Compose',
    'messages.to': 'To',
    'messages.subject': 'Subject',
    'messages.send': 'Send',

    // Settings
    'settings.title': 'Settings',
    'settings.account': 'Account',
    'settings.notifications': 'Notifications',
    'settings.security': 'Security',
    'settings.language': 'Language',
    'settings.timezone': 'Timezone',
    'settings.theme': 'Theme',

    // Errors
    'error.not_found': 'Page not found',
    'error.unauthorized': 'Unauthorized access',
    'error.forbidden': 'Access denied',
    'error.server_error': 'Server error',
  },
  zh: {
    // Common
    'app.name': 'LYC 智库',
    'app.tagline': '高管搜寻与领导力智库',
    'common.loading': '加载中...',
    'common.error': '发生错误',
    'common.save': '保存',
    'common.cancel': '取消',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.create': '创建',
    'common.search': '搜索',
    'common.filter': '筛选',
    'common.export': '导出',
    'common.import': '导入',
    'common.view': '查看',
    'common.back': '返回',
    'common.next': '下一步',
    'common.submit': '提交',
    'common.confirm': '确认',
    'common.close': '关闭',

    // Navigation
    'nav.dashboard': '仪表盘',
    'nav.mandates': '委托',
    'nav.pipeline': '管道',
    'nav.candidates': '候选人',
    'nav.companies': '公司',
    'nav.intelligence': '智库',
    'nav.reports': '报告',
    'nav.settings': '设置',
    'nav.profile': '个人资料',
    'nav.logout': '退出登录',

    // Auth
    'auth.login': '登录',
    'auth.signup': '注册',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.forgot_password': '忘记密码?',
    'auth.reset_password': '重置密码',
    'auth.login_title': '欢迎回来',
    'auth.signup_title': '创建账户',

    // Dashboard
    'dashboard.welcome': '欢迎回来',
    'dashboard.active_mandates': '活跃委托',
    'dashboard.candidates_in_pipeline': '管道候选人',
    'dashboard.interviews_today': '今日面试',
    'dashboard.recent_activity': '最近活动',

    // Mandates
    'mandates.title': '委托',
    'mandates.active': '活跃',
    'mandates.completed': '已完成',
    'mandates.paused': '暂停',
    'mandates.new_mandate': '新建委托',
    'mandates.edit_mandate': '编辑委托',
    'mandates.client': '客户',
    'mandates.role': '职位',
    'mandates.status': '状态',
    'mandates.priority': '优先级',
    'mandates.target_close': '目标完成',
    'mandates.created': '创建时间',
    'mandates.candidates': '候选人',

    // Candidates
    'candidates.title': '候选人',
    'candidates.profile': '档案',
    'candidates.experience': '经历',
    'candidates.education': '教育',
    'candidates.skills': '技能',
    'candidates.current_company': '当前公司',
    'candidates.current_title': '当前职位',
    'candidates.location': '地点',
    'candidates.availability': '可用性',
    'candidates.add_to_pipeline': '加入管道',
    'candidates.shortlist': '候选人名单',
    'candidates.reject': '拒绝',

    // Interviews
    'interviews.title': '面试',
    'interviews.scheduled': '已安排',
    'interviews.completed': '已完成',
    'interviews.cancelled': '已取消',
    'interviews.reschedule': '重新安排',
    'interviews.confirm': '确认面试',

    // Messages
    'messages.title': '消息',
    'messages.inbox': '收件箱',
    'messages.sent': '已发送',
    'messages.archive': '归档',
    'messages.compose': '撰写',
    'messages.to': '收件人',
    'messages.subject': '主题',
    'messages.send': '发送',

    // Settings
    'settings.title': '设置',
    'settings.account': '账户',
    'settings.notifications': '通知',
    'settings.security': '安全',
    'settings.language': '语言',
    'settings.timezone': '时区',
    'settings.theme': '主题',

    // Errors
    'error.not_found': '页面未找到',
    'error.unauthorized': '未授权访问',
    'error.forbidden': '访问被拒绝',
    'error.server_error': '服务器错误',
  },
  ja: {
    // Common
    'app.name': 'LYC Intelligence',
    'app.tagline': 'エグゼクティブサーチ＆リーダーシップインテリジェンス',
    'common.loading': '読み込み中...',
    'common.error': 'エラーが発生しました',
    'common.save': '保存',
    'common.cancel': 'キャンセル',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.create': '作成',
    'common.search': '検索',
    'common.filter': 'フィルター',
    'common.export': 'エクスポート',
    'common.import': 'インポート',
    'common.view': '表示',
    'common.back': '戻る',
    'common.next': '次へ',
    'common.submit': '送信',
    'common.confirm': '確認',
    'common.close': '閉じる',

    // Navigation
    'nav.dashboard': 'ダッシュボード',
    'nav.mandates': '案件',
    'nav.pipeline': 'パイプライン',
    'nav.candidates': '候補者',
    'nav.companies': '企業',
    'nav.intelligence': 'インテリジェンス',
    'nav.reports': 'レポート',
    'nav.settings': '設定',
    'nav.profile': 'プロフィール',
    'nav.logout': 'ログアウト',

    // Auth
    'auth.login': 'ログイン',
    'auth.signup': '登録',
    'auth.email': 'メール',
    'auth.password': 'パスワード',
    'auth.forgot_password': 'パスワードを忘れた?',
    'auth.reset_password': 'パスワードリセット',
    'auth.login_title': 'おかえりなさい',
    'auth.signup_title': 'アカウント作成',

    // Dashboard
    'dashboard.welcome': 'おかえりなさい',
    'dashboard.active_mandates': 'アクティブ案件',
    'dashboard.candidates_in_pipeline': 'パイプライン候補者',
    'dashboard.interviews_today': '本日の面接',
    'dashboard.recent_activity': '最近のアクティビティ',

    // Mandates
    'mandates.title': '案件',
    'mandates.active': 'アクティブ',
    'mandates.completed': '完了',
    'mandates.paused': '一時停止',
    'mandates.new_mandate': '新規案件',
    'mandates.edit_mandate': '案件編集',
    'mandates.client': 'クライアント',
    'mandates.role': '職位',
    'mandates.status': 'ステータス',
    'mandates.priority': '優先度',
    'mandates.target_close': '目標クローズ',
    'mandates.created': '作成日',
    'mandates.candidates': '候補者',

    // Candidates
    'candidates.title': '候補者',
    'candidates.profile': 'プロフィール',
    'candidates.experience': '経験',
    'candidates.education': '学歴',
    'candidates.skills': 'スキル',
    'candidates.current_company': '現在の会社',
    'candidates.current_title': '現在の職位',
    'candidates.location': '勤務地',
    'candidates.availability': '稼働状況',
    'candidates.add_to_pipeline': 'パイプラインに追加',
    'candidates.shortlist': 'ショートリスト',
    'candidates.reject': '却下',

    // Interviews
    'interviews.title': '面接',
    'interviews.scheduled': '予定',
    'interviews.completed': '完了',
    'interviews.cancelled': 'キャンセル',
    'interviews.reschedule': '再日程調整',
    'interviews.confirm': '面接確定',

    // Messages
    'messages.title': 'メッセージ',
    'messages.inbox': '受信箱',
    'messages.sent': '送信済み',
    'messages.archive': 'アーカイブ',
    'messages.compose': '作成',
    'messages.to': '宛先',
    'messages.subject': '件名',
    'messages.send': '送信',

    // Settings
    'settings.title': '設定',
    'settings.account': 'アカウント',
    'settings.notifications': '通知',
    'settings.security': 'セキュリティ',
    'settings.language': '言語',
    'settings.timezone': 'タイムゾーン',
    'settings.theme': 'テーマ',

    // Errors
    'error.not_found': 'ページが見つかりません',
    'error.unauthorized': '認証が必要です',
    'error.forbidden': 'アクセスが拒否されました',
    'error.server_error': 'サーバーエラー',
  },
};

// Context
interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

// Provider
export function I18nProvider({ children, defaultLocale = 'en' }: { children: ReactNode; defaultLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    // Check localStorage
    const stored = localStorage.getItem('lyc_locale') as Locale | null;
    if (stored && translations[stored]) return stored;
    // Check browser preference
    const browserLang = navigator.language.split('-')[0] as Locale;
    if (translations[browserLang]) return browserLang;
    return defaultLocale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('lyc_locale', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[locale]?.[key] || translations['en']?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      });
    }
    return text;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// Hook
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// HOC for class components
export function withI18n<P extends { t: (key: string) => string }>(
  Component: React.ComponentType<P>
): React.FC<Omit<P, 't'>> {
  return function I18nWrapper(props) {
    const { t } = useI18n();
    return <Component {...(props as P)} t={t} />;
  };
}