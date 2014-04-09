using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Configuration;
using System.Reflection;

namespace BeaconServSite.Code
{
    public static class TypeResolver
    {
        private static IBeaconProvider _iBeaconProvider;
        public static IBeaconProvider IBeaconProvider
        {
            get
            {
                if (_iBeaconProvider == null)
                {
                    _iBeaconProvider = ResolveType<IBeaconProvider>(ConfigurationManager.AppSettings["Beacon.BeaconProvider"]);
                }
                return _iBeaconProvider;
            }
        }

        private static T ResolveType<T>(string typeName) where T : class
        {
            var type = Assembly.GetCallingAssembly().GetType(typeName);
            if (type == null) return null;

            return Activator.CreateInstance(type) as T;
        }
    }
}