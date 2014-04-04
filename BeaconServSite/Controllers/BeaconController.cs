﻿using BeaconServSite.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;
using System.Xml.Linq;

using BeaconServSite.Code;

namespace BeaconServSite.Controllers
{
    [RoutePrefix("beacon")]
    public class BeaconController : ApiController
    {
        public static readonly Guid KlickGuid = new Guid("2F73D96D-F86E-4F95-B88D-694CEFE5837F");

        private static Dictionary<Guid, Dictionary<int, Dictionary<int, Beacon>>> beacons;
        private DateTime? lastLoad;


        public BeaconController()
        {

        }

        private string XmlPath
        {
            get
            {
                var path = System.Configuration.ConfigurationManager.AppSettings["beaconfile"];

                path = path.Replace("|App_Data|", HttpContext.Current.Server.MapPath("~/App_Data"));

                return path;
            }
        }

        private void loadBeacons()
        {

            if (File.Exists(XmlPath))
            {
                var fileTime = File.GetLastWriteTime(XmlPath);

                if (beacons != null && fileTime <= lastLoad)
                {
                    return;
                }

                lastLoad = fileTime;

                var doc = XDocument.Load(XmlPath);

                beacons = Beacon.LoadFromXml(doc);
            }
            else
            {
                beacons = new Dictionary<Guid, Dictionary<int, Dictionary<int, Beacon>>>();
            }

        }

        private void saveBeacons()
        {
            var doc = Beacon.SerializeBeaconList(beacons);

            doc.Save(XmlPath);

            var fileTime = File.GetLastWriteTime(XmlPath);

            lastLoad = fileTime;
        }

        [HttpGet]
        [Route("{id:int}")]
        public string Get(int id)
        {
            return "Yep, got it";
        }

        [HttpGet]
        [Route("{uuid}/{major}/{minor}")]
        public Beacon Get(Guid uuid, int major, int minor)
        {
            loadBeacons();

            var response = new BeaconResponse();
            Beacon result = findBeacon(uuid, major, minor, true);

            if (result != null) return result;

            throw new HttpResponseException(System.Net.HttpStatusCode.NotFound);

        }

        [HttpGet]
        [Route("")]
        public object GetAllBeacons()
        {
            loadBeacons();

            return beacons;

        }

        [HttpPost]
        [Route("")]
        public void SaveBeacon(Beacon beacon)
        {
            loadBeacons();

            var old = findBeacon(beacon.UUID ?? Guid.Empty, beacon.Major ?? -1, beacon.Minor ?? -1, false);

            if (old != null)
            {
                if (!string.IsNullOrEmpty(old.Image))
                {
                    File.Delete(HttpContext.Current.Server.MapPath("~" + old.Image));
                }

                deleteBeacon(old);
            }

            insertBeacon(beacon);

            saveBeacons();
        }

        [HttpPost]
        [Route("image")]
        public async Task<string> UploadImage(Guid? uuid, int? major, int? minor)
        {
            loadBeacons();

            MultipartFileData file = null;

            if (!Request.Content.IsMimeMultipartContent("form-data"))
            {
                throw new HttpResponseException(System.Net.HttpStatusCode.BadRequest);
            }

            var streamProvider = new MultipartFormDataStreamProvider(HttpContext.Current.Server.MapPath("~/Content/photos"));

            var bodyparts = await Request.Content.ReadAsMultipartAsync(streamProvider);

            file = bodyparts.FileData.FirstOrDefault();

            if (file == null)
            {
                throw new HttpResponseException(System.Net.HttpStatusCode.BadRequest);
            }

            var filename = Path.GetFileName(file.Headers.ContentDisposition.FileName.Trim('"'));

            var destFilename = string.Format("{0}.{1}.{2}{3}", uuid ?? Guid.Empty, major ?? -1, minor ?? -1, Path.GetExtension(filename));

            var realNewFilename = HttpContext.Current.Server.MapPath("~/Content/photos/" + destFilename);

            try
            {
                if (File.Exists(realNewFilename))
                    File.Delete(realNewFilename);
                    
                File.Move(file.LocalFileName, realNewFilename);

            }
            catch
            {
                File.Delete(file.LocalFileName);
                throw;
            }

            return ControllerContext.Configuration.VirtualPathRoot + "Content/photos/" + destFilename;
            
            
        }

        private Beacon findBeacon(Guid uuid, int major, int minor, bool returnDefault)
        {
            if (beacons.ContainsKey(uuid))
            {
                if (beacons[uuid].ContainsKey(major))
                {
                    if (beacons[uuid][major].ContainsKey(minor))
                    {
                        return beacons[uuid][major][minor];
                    }
                    else if (returnDefault && beacons[uuid][major].ContainsKey(-1))
                    {
                        return beacons[uuid][major][-1];
                    }
                }
                else if (returnDefault && beacons[uuid].ContainsKey(-1))
                {
                    return beacons[uuid][-1][-1];
                }
            }
            else if (returnDefault && beacons.ContainsKey(Guid.Empty))
            {
                return beacons[Guid.Empty][-1][-1];
            }

            return null;

        }

        private void deleteBeacon(Beacon beacon)
        {
            beacons[beacon.UUID ?? Guid.Empty][beacon.Major ?? -1].Remove(beacon.Minor ?? -1);

            if (beacons[beacon.UUID ?? Guid.Empty][beacon.Major ?? -1].Count == 0)
            {
                beacons[beacon.UUID ?? Guid.Empty].Remove(beacon.Major ?? -1);

                if (beacons[beacon.UUID ?? Guid.Empty].Count == 0)
                {
                    beacons.Remove(beacon.UUID ?? Guid.Empty);
                }
            }
        }

        private void insertBeacon(Beacon beacon)
        {
            if (!beacons.ContainsKey(beacon.UUID ?? Guid.Empty))
                beacons[beacon.UUID ?? Guid.Empty] = new Dictionary<int, Dictionary<int, Beacon>>();

            if (!beacons[beacon.UUID ?? Guid.Empty].ContainsKey(beacon.Major ?? -1))
                beacons[beacon.UUID ?? Guid.Empty][beacon.Major ?? -1] = new Dictionary<int, Beacon>();

            beacons[beacon.UUID ?? Guid.Empty][beacon.Major ?? -1][beacon.Minor ?? -1] = beacon;
        }
    }



}

