"use strict";

const AltTab = imports.ui.altTab;
const GObject = imports.gi.GObject;
const Main = imports.ui.main;

class Extension {
  getWindows;
  windowSwitcherPopup;

  _getWindows;
  _windowSwitcherPopup;

  constructor() {
    this._getWindows = AltTab.getWindows;
    this._windowSwitcherPopup = AltTab.WindowSwitcherPopup;

    this.getWindows = (workspace) => {
      const monitor = global.display.get_current_monitor();
      return this._getWindows(workspace)
        .filter((w) => w.get_monitor() === monitor);
    };

    this.windowSwitcherPopup = GObject.registerClass(
      class AlTabPopup extends AltTab.WindowSwitcherPopup {
        vfunc_allocate() {
          const primaryMonitor = Main.layoutManager.primaryMonitor;
          Main.layoutManager.primaryMonitor = Main.layoutManager.currentMonitor;

          const result = super.vfunc_allocate.apply(this, arguments);
          Main.layoutManager.primaryMonitor = primaryMonitor;

          return result;
        }
      }
    );
  }

  enable() {
    AltTab.getWindows = this.getWindows;
    AltTab.WindowSwitcherPopup = this.windowSwitcherPopup;
  }

  disable() {
    AltTab.getWindows = this._getWindows;
    AltTab.WindowSwitcherPopup = this._windowSwitcherPopup;
  }
}

function init() {
  return new Extension();
}