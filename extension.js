"use strict";

const AltTab = imports.ui.altTab;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Prefs = Me.imports.prefs;

const {
  WS_CURRENT_MONITOR_KEY,
  WS_FILTER_MONITOR_KEY,
  AS_CURRENT_MONITOR_KEY,
  AS_FILTER_WORKSPACE_KEY,
  AS_FILTER_MONITOR_KEY,
} = Prefs.Fields;

// Original references
let _windowSwitcherPopup;
let _getWindows;
let _appSwitcherPopup;
let _appSwitcher;

// Modified references
let windowSwitcherPopup;
let getWindows;
let appSwitcherPopup;
let appSwitcher;

// Options
let AS_FILTER_WORKSPACE;
let AS_FILTER_MONITOR;

// Settings
let settings;

let wsCurrentMonitorSignal;
let wsFilterMonitorSignal;
let asCurrentMonitorSignal;
let asFilterWorkspaceSignal;
let asFilterMonitorSignal;

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
  AS_FILTER_WORKSPACE = settings.get_boolean(AS_FILTER_WORKSPACE_KEY);
  AS_FILTER_MONITOR = settings.get_boolean(AS_FILTER_MONITOR_KEY);

  wsCurrentMonitorSignal = settings.connect(
    `changed::${WS_CURRENT_MONITOR_KEY}`,
    function () {
      AltTab.WindowSwitcherPopup = settings.get_boolean(WS_CURRENT_MONITOR_KEY)
        ? windowSwitcherPopup
        : _windowSwitcherPopup;
    }
  );

  wsFilterMonitorSignal = settings.connect(
    `changed::${WS_FILTER_MONITOR_KEY}`,
    function () {
      AltTab.getWindows = settings.get_boolean(WS_FILTER_MONITOR_KEY)
        ? getWindows
        : _getWindows;
    }
  );

  asCurrentMonitorSignal = settings.connect(
    `changed::${AS_CURRENT_MONITOR_KEY}`,
    function () {
      AltTab.AppSwitcherPopup = settings.get_boolean(AS_CURRENT_MONITOR_KEY)
        ? appSwitcherPopup
        : _appSwitcherPopup;
    }
  );

  asFilterWorkspaceSignal = settings.connect(
    `changed::${AS_FILTER_WORKSPACE_KEY}`,
    function () {
      AS_FILTER_WORKSPACE = settings.get_boolean(AS_FILTER_WORKSPACE_KEY);
    }
  );

  asFilterMonitorSignal = settings.connect(
    `changed::${AS_FILTER_MONITOR_KEY}`,
    function () {
      AS_FILTER_MONITOR = settings.get_boolean(AS_FILTER_MONITOR_KEY);
    }
  );
}

function disableSettings() {
  settings.disconnect(wsCurrentMonitorSignal);
  settings.disconnect(wsFilterMonitorSignal);
  settings.disconnect(asCurrentMonitorSignal);
  settings.disconnect(asFilterWorkspaceSignal);
  settings.disconnect(asFilterMonitorSignal);

  settings = null;
}

// Extension body

function init() {
  _getWindows = AltTab.getWindows;
  _windowSwitcherPopup = AltTab.WindowSwitcherPopup;
  _appSwitcherPopup = AltTab.AppSwitcherPopup;

  settings = getSchema();

  windowSwitcherPopup = GObject.registerClass(
    class WSPopup extends AltTab.WindowSwitcherPopup {
      vfunc_allocate(...args) {
        const primaryMonitor = Main.layoutManager.primaryMonitor;
        Main.layoutManager.primaryMonitor = Main.layoutManager.currentMonitor;
        super.vfunc_allocate.apply(this, args);
        Main.layoutManager.primaryMonitor = primaryMonitor;
      }
    }
  );

  getWindows = function (workspace) {
    const monitor = global.display.get_current_monitor();
    return _getWindows(workspace).filter((w) => w.get_monitor() === monitor);
  };

  appSwitcherPopup = GObject.registerClass(
    class ASPopup extends AltTab.AppSwitcherPopup {
      vfunc_allocate(...args) {
        const primaryMonitor = Main.layoutManager.primaryMonitor;
        Main.layoutManager.primaryMonitor = Main.layoutManager.currentMonitor;
        super.vfunc_allocate.apply(this, args);
        Main.layoutManager.primaryMonitor = primaryMonitor;
      }
    }
  );

  appSwitcher = GObject.registerClass(
    class AS extends AltTab.AppSwitcher {
      _init(apps, altTabPopup) {
        if (AS_FILTER_WORKSPACE || AS_FILTER_MONITOR) {
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
        }

        super._init(apps, altTabPopup);
      }
    }
  );
}

function enable() {
  enableSettings();

  AltTab.WindowSwitcherPopup = settings.get_boolean(WS_CURRENT_MONITOR_KEY)
    ? windowSwitcherPopup
    : _windowSwitcherPopup;
  AltTab.getWindows = settings.get_boolean(WS_FILTER_MONITOR_KEY)
    ? getWindows
    : _getWindows;

  AltTab.AppSwitcherPopup = settings.get_boolean(AS_CURRENT_MONITOR_KEY)
    ? appSwitcherPopup
    : _appSwitcherPopup;
  AltTab.AppSwitcher = appSwitcher;
}

function disable() {
  disableSettings();

  AltTab.WindowSwitcherPopup = _windowSwitcherPopup;
  AltTab.getWindows = _getWindows;

  AltTab.AppSwitcher = _appSwitcher;
  AltTab.AppSwitcherPopup = _appSwitcherPopup;
}
