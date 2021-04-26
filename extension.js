"use strict";

const AltTab = imports.ui.altTab;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Prefs = Me.imports.prefs;

// Original references
let _getWindows;
let _windowSwitcherPopup;

// Settings
let settings;
let filterPerMonitorSignal;
let showInCurrentSignal;
let FILTER_PER_MONITOR = true;
let SHOW_IN_CURRENT = true;

// Modified
let getWindows;
let windowSwitcherPopup;

//

function getSchema() {
  let schemaDir = Me.dir.get_child("schemas").get_path();
  let schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir, Gio.SettingsSchemaSource.get_default(), false);
  let schema = schemaSource.lookup(Prefs.SCHEMA_NAME, false);

  if (!schema) {
    throw new Error("Cannot find schemas");
  }

  return new Gio.Settings({ settings_schema: schema });
}

function enableSettings() {
  const { FILTER_PER_MONITOR_KEY, SHOW_IN_CURRENT_KEY } = Prefs.Fields;

  FILTER_PER_MONITOR = settings.get_boolean(FILTER_PER_MONITOR_KEY);
  SHOW_IN_CURRENT = settings.get_boolean(SHOW_IN_CURRENT_KEY);

  filterPerMonitorSignal = settings.connect(`changed::${FILTER_PER_MONITOR_KEY}`, () => {
    FILTER_PER_MONITOR = settings.get_boolean(FILTER_PER_MONITOR_KEY);
    AltTab.getWindows = FILTER_PER_MONITOR ? getWindows : _getWindows;
  });

  showInCurrentSignal = settings.connect(`changed::${SHOW_IN_CURRENT_KEY}`, () => {
    SHOW_IN_CURRENT = settings.get_boolean(SHOW_IN_CURRENT_KEY);
    AltTab.WindowSwitcherPopup = SHOW_IN_CURRENT ? windowSwitcherPopup : _windowSwitcherPopup;
  });
}

function disableSettings() {
  settings.disconnect(filterPerMonitorSignal);
  settings.disconnect(showInCurrentSignal);
}

//

function init() {
  _getWindows = AltTab.getWindows;
  _windowSwitcherPopup = AltTab.WindowSwitcherPopup;

  settings = getSchema();

  getWindows = function (workspace) {
    const monitor = global.display.get_current_monitor();
    return _getWindows(workspace)
      .filter((w) => w.get_monitor() === monitor);
  };

  windowSwitcherPopup = GObject.registerClass(
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

function enable() {
  enableSettings();

  AltTab.getWindows = FILTER_PER_MONITOR ? getWindows : _getWindows;
  AltTab.WindowSwitcherPopup = SHOW_IN_CURRENT ? windowSwitcherPopup : _windowSwitcherPopup;
}

function disable() {
  AltTab.getWindows = _getWindows;
  AltTab.WindowSwitcherPopup = _windowSwitcherPopup;

  disableSettings();
}