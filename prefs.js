"use strict";

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;

var SCHEMA_NAME = "org.gnome.shell.extensions.monitor-window-switcher";

var Fields = {
  WS_CURRENT_MONITOR_KEY: "ws-current-monitor",
  WS_FILTER_MONITOR_KEY: "ws-filter-monitor",

  AS_CURRENT_MONITOR_KEY: "as-current-monitor",
  AS_FILTER_WORKSPACE_KEY: "as-filter-workspace",
  AS_FILTER_MONITOR_KEY: "as-filter-monitor",
};

function init() {}

function buildPrefsWidget() {
  const settings = ExtensionUtils.getSettings(SCHEMA_NAME);

  // Parent widget
  const prefsWidget = new Gtk.Grid({
    margin_top: 16,
    margin_start: 16,
    margin_end: 16,
    margin_bottom: 16,
    halign: Gtk.Align.CENTER,
    column_spacing: 24,
    row_spacing: 12,
    visible: true,
  });

  // Window switcher label
  const wsLabel = new Gtk.Label({
    label: "<b>Window switcher:</b>",
    halign: Gtk.Align.START,
    visible: true,
    use_markup: true,
  });
  prefsWidget.attach(wsLabel, 0, 0, 1, 1);

  // Label & switch for `ws-current-monitor`
  const wsShowLabel = new Gtk.Label({
    label: "Show on current monitor:",
    halign: Gtk.Align.START,
    visible: true,
  });
  prefsWidget.attach(wsShowLabel, 0, 1, 1, 1);

  const wsShowSwitch = new Gtk.Switch({
    active: settings.get_boolean(Fields.WS_CURRENT_MONITOR_KEY),
    halign: Gtk.Align.END,
    visible: true,
  });
  prefsWidget.attach(wsShowSwitch, 1, 1, 1, 1);

  settings.bind(
    Fields.WS_CURRENT_MONITOR_KEY,
    wsShowSwitch,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );

  // Label & switch for `ws-filter-monitor`
  const wsFilterLabel = new Gtk.Label({
    label: "Filter by current monitor:",
    halign: Gtk.Align.START,
    visible: true,
  });
  prefsWidget.attach(wsFilterLabel, 0, 2, 1, 1);

  const wsFilterSwitch = new Gtk.Switch({
    active: settings.get_boolean(Fields.WS_FILTER_MONITOR_KEY),
    halign: Gtk.Align.END,
    visible: true,
  });
  prefsWidget.attach(wsFilterSwitch, 1, 2, 1, 1);

  settings.bind(
    Fields.WS_FILTER_MONITOR_KEY,
    wsFilterSwitch,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );

  // Separator
  const separator = new Gtk.Separator({
    orientation: Gtk.Orientation.VERTICAL,
    visible: true,
  });
  prefsWidget.attach(separator, 2, 0, 1, 4);

  // Application switcher label
  const asLabel = new Gtk.Label({
    label: "<b>Application switcher:</b>",
    halign: Gtk.Align.START,
    visible: true,
    use_markup: true,
  });
  prefsWidget.attach(asLabel, 3, 0, 1, 1);

  // Label & switch for `ws-current-monitor`
  const asShowLabel = new Gtk.Label({
    label: "Show on current monitor:",
    halign: Gtk.Align.START,
    visible: true,
  });
  prefsWidget.attach(asShowLabel, 3, 1, 1, 1);

  const asShowSwitch = new Gtk.Switch({
    active: settings.get_boolean(Fields.AS_CURRENT_MONITOR_KEY),
    halign: Gtk.Align.END,
    visible: true,
  });
  prefsWidget.attach(asShowSwitch, 4, 1, 1, 1);

  settings.bind(
    Fields.AS_CURRENT_MONITOR_KEY,
    asShowSwitch,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );

  // Label & switch for `as-filter-workspace`
  const asFilterWorkspaceLabel = new Gtk.Label({
    label: "Filter by current workspace:",
    halign: Gtk.Align.START,
    visible: true,
  });
  prefsWidget.attach(asFilterWorkspaceLabel, 3, 2, 1, 1);

  const asFilterWorkspaceSwitch = new Gtk.Switch({
    active: settings.get_boolean(Fields.AS_FILTER_WORKSPACE_KEY),
    halign: Gtk.Align.END,
    visible: true,
  });
  prefsWidget.attach(asFilterWorkspaceSwitch, 4, 2, 1, 1);

  settings.bind(
    Fields.AS_FILTER_WORKSPACE_KEY,
    asFilterWorkspaceSwitch,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );

  // Label & switch for `as-filter-monitor`
  const asFilterMonitorLabel = new Gtk.Label({
    label: "Filter by current monitor:",
    halign: Gtk.Align.START,
    visible: true,
  });
  prefsWidget.attach(asFilterMonitorLabel, 3, 3, 1, 1);

  const asFilterMonitorSwitch = new Gtk.Switch({
    active: settings.get_boolean(Fields.AS_FILTER_MONITOR_KEY),
    halign: Gtk.Align.END,
    visible: true,
  });
  prefsWidget.attach(asFilterMonitorSwitch, 4, 3, 1, 1);

  settings.bind(
    Fields.AS_FILTER_MONITOR_KEY,
    asFilterMonitorSwitch,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );

  // Return parent widget
  return prefsWidget;
}
