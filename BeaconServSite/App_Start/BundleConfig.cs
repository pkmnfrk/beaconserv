﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Optimization;

namespace BeaconServSite
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                "~/Scripts/jquery-{version}.js",
                "~/Scripts/jquery.touchwipe.min.js"));

            bundles.Add(new ScriptBundle("~/bundles/knockout").Include(
                "~/Scripts/knockout-{version}.js",
                "~/Scripts/knockout.validation.js"));

            bundles.Add(new ScriptBundle("~/bundles/app").Include(
                "~/Scripts/app/ajaxPrefilters.js",
                "~/Scripts/app/app.bindings.js",
                "~/Scripts/app/app.datamodel.js",
                "~/Scripts/app/app.viewmodel.js",
                "~/Scripts/app/home.viewmodel.js",
                "~/Scripts/app/login.viewmodel.js",
                "~/Scripts/app/register.viewmodel.js",
                "~/Scripts/app/registerExternal.viewmodel.js",
                "~/Scripts/app/manage.viewmodel.js",
                "~/Scripts/app/userInfo.viewmodel.js",
                "~/Scripts/app/_run.js"));

            // Use the development version of Modernizr to develop with and learn from. Then, when you're
            // ready for production, use the build tool at http://modernizr.com to pick only the tests you need.
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                "~/Scripts/bootstrap.js",
                "~/Scripts/respond.js"));

            bundles.Add(new ScriptBundle("~/bundles/hook").Include(
               "~/Scripts/hook.min.js",
               "~/Scripts/mousewheel.js"));

            bundles.Add(new ScriptBundle("~/Scripts/Main").Include(
                "~/Scripts/Common.js",
                "~/Scripts/Main.js"));

            bundles.Add(new ScriptBundle("~/Scripts/Single").Include(
                "~/Scripts/Common.js",
                "~/Scripts/Single.js"));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                 "~/Content/Site.css",
                 "~/Content/hook.css"));

            bundles.Add(new StyleBundle("~/Content/single").Include(
                 "~/Content/Single.css",
                 "~/Content/animations.css"));

            bundles.Add(new ScriptBundle("~/Scripts/display").Include(
                "~/Scripts/bouncemarker.js",
                "~/Scripts/AnimatedMarker.js",
                "~/Scripts/leaflet.label.js",
                "~/Scripts/oms.min.js",
                "~/Scripts/Common.js",
                "~/Scripts/DisplayViews.js",
                "~/Scripts/Display.js"));

            bundles.Add(new StyleBundle("~/Content/display").Include(
                "~/Content/leaflet.label.css",
                 "~/Content/Display.css"));

        }
    }
}
