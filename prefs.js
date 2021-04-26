"use strict";

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;

var SCHEMA_NAME = "org.gnome.shell.extensions.monitor-window-switcher";
var Fields = {
  FILTER_PER_MONITOR_KEY: "filter-per-monitor",
  SHOW_IN_CURRENT_KEY: "show-in-current",
};

function init() { }

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
    visible: true
  });

  // Label & switch for `filter-per-monitor`
  const filterLabel = new Gtk.Label({
    label: "Filter windows by the monitor they are open on:",
    halign: Gtk.Align.START,
    visible: true
  });
  prefsWidget.attach(filterLabel, 0, 1, 1, 1);

  const filterSwitch = new Gtk.Switch({
    active: settings.get_boolean(Fields.FILTER_PER_MONITOR_KEY),
    halign: Gtk.Align.END,
    visible: true
  });
  prefsWidget.attach(filterSwitch, 1, 1, 1, 1);

  settings.bind(
    Fields.FILTER_PER_MONITOR_KEY,
    filterSwitch,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );

  // Label & switch for `show-in-current`
  const showLabel = new Gtk.Label({
    label: "Show the window switcher on current monitor:",
    halign: Gtk.Align.START,
    visible: true
  });
  prefsWidget.attach(showLabel, 0, 0, 1, 1);

  const showSwitch = new Gtk.Switch({
    active: settings.get_boolean(Fields.SHOW_IN_CURRENT_KEY),
    halign: Gtk.Align.END,
    visible: true
  });
  prefsWidget.attach(showSwitch, 1, 0, 1, 1);

  settings.bind(
    Fields.SHOW_IN_CURRENT_KEY,
    showSwitch,
    "active",
    Gio.SettingsBindFlags.DEFAULT
  );

  // Return parent widget
  return prefsWidget;
}
