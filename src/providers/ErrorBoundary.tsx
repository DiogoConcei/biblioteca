// import * as React from 'react';
// import ErrorScreen from '../components/ErrorScreen/ErrorScreen';
// import useUIStore from '../store/useUIStore';
// import useSerieStore from '../store/useSerieStore';

// export default class ErrorBoundary extends React.Component<{
//   children: React.ReactNode;
// }> {
//   setError = useUIStore((state) => state.setError);
//   clearError = useUIStore((state) => state.clearError);
//   error = useUIStore((state) => state.error);
//   serie = useSerieStore((state) => state.serie);

//   render() {
//     if (this.error) {
//       return <ErrorScreen error={this.error} serieName={this.serie?.name} />;
//     }
//   }
// }
