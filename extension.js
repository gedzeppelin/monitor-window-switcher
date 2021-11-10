"use strict";

const AltTab = imports.ui.altTab;
const GObject = imports.gi.GObject;
const { Gio, Shell } = imports.gi;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Prefs = Me.imports.prefs;

// Original references
let _getWindows;
let _windowSwitcherPopup;
let _appSwitcherPopup;

// Modified references
let getWindows;
let windowSwitcherPopup;
let appSwitcherPopup;

// Settings
let settings;

let wsCurrentMonitorSignal;
let wsFilterMonitorSignal;

let asCurrentMonitorSignal;
let asFilterWorkspaceSignal;
let asFilterMonitorSignal;

// Options
let WS_CURRENT_MONITOR;
let WS_FILTER_MONITOR;

let AS_CURRENT_MONITOR;
let AS_FILTER_WORKSPACE;
let AS_FILTER_MONITOR;

//

function getSchema() {
  const schemaDir = Me.dir.get_child("schemas").get_path();
  const schemaSource = Gio.SettingsSchemaSource.new_from_directory(
    schemaDir,
    Gio.SettingsSchemaSource.get_default(),
    false
  );
  const schema = schemaSource.lookup(Prefs.SCHEMA_NAME, false);

  if (!schema) throw new Error("Cannot find schemas");

  return new Gio.Settings({ settings_schema: schema });
}

function enableSettings() {
  const {
    WS_CURRENT_MONITOR_KEY,
    WS_FILTER_MONITOR_KEY,
    AS_CURRENT_MONITOR_KEY,
    AS_FILTER_WORKSPACE_KEY,
    AS_FILTER_MONITOR_KEY,
  } = Prefs.Fields;

  WS_CURRENT_MONITOR = settings.get_boolean(WS_CURRENT_MONITOR_KEY);
  WS_FILTER_MONITOR = settings.get_boolean(WS_FILTER_MONITOR_KEY);

  AS_CURRENT_MONITOR = settings.get_boolean(AS_CURRENT_MONITOR_KEY);
  AS_FILTER_WORKSPACE = settings.get_boolean(AS_FILTER_WORKSPACE_KEY);
  AS_FILTER_MONITOR = settings.get_boolean(AS_FILTER_MONITOR_KEY);

  wsCurrentMonitorSignal = settings.connect(
    `changed::${WS_CURRENT_MONITOR_KEY}`,
    () => (WS_CURRENT_MONITOR = settings.get_boolean(WS_CURRENT_MONITOR_KEY))
  );

  wsFilterMonitorSignal = settings.connect(
    `changed::${WS_FILTER_MONITOR_KEY}`,
    () => (WS_FILTER_MONITOR = settings.get_boolean(WS_FILTER_MONITOR_KEY))
  );

  asCurrentMonitorSignal = settings.connect(
    `changed::${AS_CURRENT_MONITOR_KEY}`,
    () => (AS_CURRENT_MONITOR = settings.get_boolean(AS_CURRENT_MONITOR_KEY))
  );

  asFilterWorkspaceSignal = settings.connect(
    `changed::${AS_FILTER_WORKSPACE_KEY}`,
    () => (AS_FILTER_WORKSPACE = settings.get_boolean(AS_FILTER_WORKSPACE_KEY))
  );

  asFilterMonitorSignal = settings.connect(
    `changed::${AS_FILTER_MONITOR_KEY}`,
    () => (AS_FILTER_MONITOR = settings.get_boolean(AS_FILTER_MONITOR_KEY))
  );
}

function disableSettings() {
  settings.disconnect(wsCurrentMonitorSignal);
  settings.disconnect(wsFilterMonitorSignal);
  settings.disconnect(asCurrentMonitorSignal);
  settings.disconnect(asFilterWorkspaceSignal);
  settings.disconnect(asFilterMonitorSignal);
}

// Extension body

function init() {
  _getWindows = AltTab.getWindows;
  _windowSwitcherPopup = AltTab.WindowSwitcherPopup;
  _appSwitcherPopup = AltTab.AppSwitcherPopup;

  settings = getSchema();

  getWindows = function (workspace) {
    if (WS_FILTER_MONITOR) {
      const monitor = global.display.get_current_monitor();
      return _getWindows(workspace).filter((w) => w.get_monitor() === monitor);
    }

    return _getWindows(workspace);
  };

  windowSwitcherPopup = GObject.registerClass(
    class WSPopup extends AltTab.WindowSwitcherPopup {
      vfunc_allocate(...args) {
        if (WS_CURRENT_MONITOR) {
          const primaryMonitor = Main.layoutManager.primaryMonitor;
          Main.layoutManager.primaryMonitor = Main.layoutManager.currentMonitor;
          super.vfunc_allocate.apply(this, args);
          Main.layoutManager.primaryMonitor = primaryMonitor;
        } else {
          super.vfunc_allocate.apply(this, args);
        }
      }
    }
  );

  appSwitcherPopup = GObject.registerClass(
    class ASPopup extends AltTab.AppSwitcherPopup {
      _init() {
        super._init();

        if (AS_FILTER_WORKSPACE || AS_FILTER_MONITOR) {
          let apps = Shell.AppSystem.get_default().get_running();

          if (AS_FILTER_WORKSPACE) {
            const wsManager = global.workspace_manager;
            const activeWs = wsManager.get_active_workspace();
            apps = apps.filter((a) => a.is_on_workspace(activeWs));
          }

          if (AS_FILTER_MONITOR) {
            const monitor = global.display.get_current_monitor();
            apps = apps.filter((a) =>
              a.get_windows().some((w) => w.get_monitor() === monitor)
            );
          }

          this._switcherList = new AltTab.AppSwitcher(apps, this);
          this._items = this._switcherList.icons;
        }
      }

      vfunc_allocate(...args) {
        if (AS_CURRENT_MONITOR) {
          const primaryMonitor = Main.layoutManager.primaryMonitor;
          Main.layoutManager.primaryMonitor = Main.layoutManager.currentMonitor;
          super.vfunc_allocate.apply(this, args);
          Main.layoutManager.primaryMonitor = primaryMonitor;
        } else {
          super.vfunc_allocate.apply(this, args);
        }
      }
    }
  );
}

function enable() {
  enableSettings();

  AltTab.getWindows = getWindows;
  AltTab.WindowSwitcherPopup = windowSwitcherPopup;
  AltTab.AppSwitcherPopup = appSwitcherPopup;
}

function disable() {
  disableSettings();

  AltTab.getWindows = _getWindows;
  AltTab.WindowSwitcherPopup = _windowSwitcherPopup;
  AltTab.AppSwitcherPopup = _appSwitcherPopup;
}
