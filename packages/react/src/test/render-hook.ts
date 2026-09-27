import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

export async function renderHook<P, T>(useValue: (props: P) => T, initial: P) {
  const props = { current: initial };
  const result = { current: undefined as T };
  const host = document.createElement("div");
  document.body.append(host);
  const root: Root = createRoot(host);

  function Probe() {
    result.current = useValue(props.current);
    return null;
  }

  async function draw() {
    await act(async () => {
      root.render(createElement(Probe));
    });
  }

  await draw();
  return {
    result,
    async rerender(next: P) {
      props.current = next;
      await draw();
    },
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      host.remove();
    },
  };
}
