"use strict";

const AltTab = imports.ui.altTab;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Prefs = Me.imports.prefs;

let FILTER_PER_MONITOR = true;
let SHOW_IN_CURRENT = true;

function getSchema() {
  let schemaDir = Me.dir.get_child("schemas").get_path();
  let schemaSource = Gio.SettingsSchemaSource.new_from_directory(schemaDir, Gio.SettingsSchemaSource.get_default(), false);
  let schema = schemaSource.lookup(Prefs.SCHEMA_NAME, false);

  if (!schema) {
    throw new Error("Cannot find schemas");
  }

  return new Gio.Settings({ settings_schema: schema });
}

class Extension {
  settings;

  // Modified
  getWindows;
  windowSwitcherPopup;

  // Original references
  _getWindows;
  _windowSwitcherPopup;

  constructor() {
    this.initSettings();

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
    AltTab.getWindows = FILTER_PER_MONITOR ? this.getWindows : this._getWindows;
    AltTab.WindowSwitcherPopup = SHOW_IN_CURRENT ? this.windowSwitcherPopup : this._windowSwitcherPopup;
  }

  disable() {
    AltTab.getWindows = this._getWindows;
    AltTab.WindowSwitcherPopup = this._windowSwitcherPopup;
  }

  initSettings() {
    this.settings = getSchema();

    const { FILTER_PER_MONITOR_KEY, SHOW_IN_CURRENT_KEY } = Prefs.Fields;

    FILTER_PER_MONITOR = this.settings.get_boolean(FILTER_PER_MONITOR_KEY);
    SHOW_IN_CURRENT = this.settings.get_boolean(SHOW_IN_CURRENT_KEY);

    this.settings.connect(`changed::${FILTER_PER_MONITOR_KEY}`, () => {
      FILTER_PER_MONITOR = this.settings.get_boolean(FILTER_PER_MONITOR_KEY);
      AltTab.getWindows = FILTER_PER_MONITOR ? this.getWindows : this._getWindows;
    });

    this.settings.connect(`changed::${SHOW_IN_CURRENT_KEY}`, () => {
      SHOW_IN_CURRENT = this.settings.get_boolean(SHOW_IN_CURRENT_KEY);
      AltTab.WindowSwitcherPopup = SHOW_IN_CURRENT ? this.windowSwitcherPopup : this._windowSwitcherPopup;
    });
  }
}

function init() {
  return new Extension();
}