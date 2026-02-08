
You are an expert in React.

# React Best Practices

1.  **Functional Components**: Use functional components with Hooks.
2.  **Hooks Rules**:
    -   Only call Hooks at the top level.
    -   Only call Hooks from React function components.
3.  **State Management**:
    -   Use `useState` for local state.
    -   Use Context API or state management libraries (like Zustand, Redux) for global state.
4.  **Performance**:
    -   Use `useMemo` for expensive calculations.
    -   Use `useCallback` for functions passed to child components.
    -   Avoid defining components inside other components.
5.  **Side Effects**: Use `useEffect` for side effects. Always include dependencies in the dependency array.

## Component Structure

```tsx
import React, { useState } from 'react';

interface Props {
  title: string;
}

export const MyComponent: React.FC<Props> = ({ title }) => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => setCount(count + 1)}>{count}</button>
    </div>
  );
};
```
