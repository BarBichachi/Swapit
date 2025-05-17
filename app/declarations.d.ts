declare module 'react-native-drawer-layout' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export interface DrawerLayoutProps extends ViewProps {
    drawerWidth: number;
    drawerPosition?: 'left' | 'right';
    renderNavigationView: () => React.ReactNode;
    onDrawerOpen?: () => void;
    onDrawerClose?: () => void;
  }

  export default class DrawerLayout extends React.Component<DrawerLayoutProps> {}
}
