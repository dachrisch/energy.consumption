interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const TabNavigation = ({ tabs, activeTab, onTabChange }: TabNavigationProps) => {
  return (
    <div className="tabs-container">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`tab-base ${activeTab === tab.id ? "button-primary" : "button-secondary"}`}
        >
          <span className="flex items-center justify-center gap-2">
            {tab.icon}
            <span>{tab.label}</span>
          </span>
        </div>
      ))}
    </div>
  );
};

export default TabNavigation;
