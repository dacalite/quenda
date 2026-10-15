// SPDX-License-Identifier: EUPL-1.2
import {
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
  type TabListProps,
  type TabPanelProps,
  type TabProps,
  type TabsProps,
} from 'react-aria-components';
import styles from './Tabs.module.css';

type Unstyled<P> = Omit<P, 'className'>;

export const Tabs = (props: Unstyled<TabsProps>) => <AriaTabs {...props} />;

export const TabList = <T extends object>(props: Unstyled<TabListProps<T>>) => (
  <AriaTabList {...props} className={styles.list} />
);

export const Tab = (props: Unstyled<TabProps>) => <AriaTab {...props} className={styles.tab} />;

export const TabPanel = (props: Unstyled<TabPanelProps>) => (
  <AriaTabPanel {...props} className={styles.panel} />
);
