import { Title } from '@solidjs/meta';
import { Loading } from 'solid-js';
import { paths, Router } from './router';
import './App.css';

// The app root: the router and the site-wide layout live here. Pages are
// the modules under src/routes.
export default function App() {
  return (
    <Router>
      {(props) => (
        <>
          <Title>Solid App</Title>
          <Loading fallback={<main class="px-4 py-12">Loading…</main>}>
            {props.children}
          </Loading>
        </>
      )}
    </Router>
  );
}
