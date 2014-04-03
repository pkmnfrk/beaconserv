using BeaconServSite.Models;
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

namespace BeaconServSite.Controllers
{
    [RoutePrefix("beacon")]
    public class BeaconController : ApiController
    {
        public static readonly Guid KlickGuid = new Guid("2F73D96D-F86E-4F95-B88D-694CEFE5837F");

        private static List<Beacon> beacons;
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

        private List<Beacon> loadBeacons()
        {

            if (File.Exists(XmlPath))
            {
                var fileTime = File.GetLastWriteTime(XmlPath);

                if (beacons != null && fileTime <= lastLoad)
                {
                    return beacons;
                }

                lastLoad = fileTime;

                var doc = XDocument.Load(XmlPath);

                return Beacon.LoadFromXml(doc);
            }
            else
            {
                return new List<Beacon>();
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
        public Beacon Get(string uuid, int major, int minor)
        {
            beacons = loadBeacons();

            var response = new BeaconResponse();

            var beacon_query = beacons.Where(b => b.UUID == new Guid(uuid) && b.Major == major && b.Minor == minor);
            if (!beacon_query.Any())
            {
                beacon_query = beacons.Where(b => b.UUID == new Guid(uuid) && b.Major == major && !b.Minor.HasValue);

                if (!beacon_query.Any())
                {
                    beacon_query = beacons.Where(b => b.UUID == new Guid(uuid) && !b.Major.HasValue);


                    if (!beacon_query.Any())
                    {
                        beacon_query = Enumerable.Repeat(new Beacon { Url = Url.Link("beacondefault", ControllerContext.RouteData.Values) }, 1);
                    }
                }
            }

            return beacon_query.First();

        }

        [HttpGet]
        [Route("")]
        public IEnumerable<Beacon> GetAllBeacons()
        {
            beacons = loadBeacons();

            return beacons;

        }

        [HttpPost]
        [Route("")]
        public void SaveBeacon(Beacon beacon)
        {
            beacons = loadBeacons();

            var old = beacons.Where(b => b.UUID == beacon.UUID && b.Major == beacon.Major && b.Minor == beacon.Minor).FirstOrDefault();



            if (old != null)
            {
                if (!string.IsNullOrEmpty(old.Image))
                {
                    File.Delete(HttpContext.Current.Server.MapPath("~" + old.Image));
                }

                beacons.Remove(old);
            }

            beacons.Add(beacon);

            saveBeacons();
        }

        [HttpPost]
        [Route("image")]
        public async Task<string> UploadImage()
        {
            beacons = loadBeacons();

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

            try
            {
                var realNewFilename = HttpContext.Current.Server.MapPath("~/Content/photos/" + filename);

                if (File.Exists(realNewFilename))
                {
                    if (!beacons.Any(b => b.Image == ControllerContext.Configuration.VirtualPathRoot + "Content/photos/" + filename))
                    {
                        File.Delete(realNewFilename);
                    }
                    else
                    {
                        var origname = filename;
                        var rand = new Random();
                        while (beacons.Any(b => b.Image == ControllerContext.Configuration.VirtualPathRoot + "Content/photos/" + filename))
                        {
                            filename = rand.Next(0, 100000) + "_" + origname;
                            realNewFilename = HttpContext.Current.Server.MapPath("~/Content/photos/" + filename);
                        }
                    }
                }

                File.Move(file.LocalFileName, realNewFilename);

            }
            catch
            {
                File.Delete(file.LocalFileName);
                throw;
            }

            return ControllerContext.Configuration.VirtualPathRoot + "Content/photos/" + filename;
            
            
        }
    }



}

