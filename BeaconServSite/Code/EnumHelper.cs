using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace BeaconServSite.Code
{
    public static class EnumHelper
    {
        public static T AsEnum<T>(this string text)
        {
            return (T)Enum.Parse(typeof(T), text);
        }
    }
}