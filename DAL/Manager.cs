﻿using backend.Models;
using Google.Cloud.Storage.V1;
using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
//using System.Data.Entity;
//using System.Data.Entity.Core.Objects;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;

namespace dal
{
    public static class Manager
    {
        private static MySqlConnectionStringBuilder csb = new MySqlConnectionStringBuilder
        {
            Server = "35.204.62.53",
            UserID = "root",
            Password = "2019",
            Database = "snacktrackdb",
            CertificateFile = @"C:\key\client.pfx",
            SslCa = @"C:\key\server-ca.pem",
            SslMode = MySqlSslMode.None,
        };
        public static string path = "https://storage.cloud.google.com/";
        /// <summary>
        /// func to add meal to db. gets an empty meal object
        /// </summary>
        /// <param name="m"></param>
        public static void addMeal(Meal m)
        {
            using (var connection = new MySqlConnection(csb.ConnectionString))
            {
                meal mm = null;
                try
                {
                    mm = Mapper.convertMealToEntityAsync(m);
                }
                catch (Exception e)
                {

                    throw e;
                }

                connection.Open();
                MySqlCommand cmd = connection.CreateCommand();
                cmd.CommandText = "INSERT INTO meals(dateTime, path, tags) VALUES(@date, @path, @tag)";
                cmd.Parameters.AddWithValue("@date", mm.dateTime.ToString("dd/MM/yyyy HH:mm:ss"));
                cmd.Parameters.AddWithValue("@path", mm.path);
                cmd.Parameters.AddWithValue("@tag", mm.tags);
                cmd.ExecuteNonQuery();
            }
        }
        /// <summary>
        /// func to return list of all meals. called by mealcontroller
        /// </summary>
        /// <returns></returns>
        public async static Task<List<backend.Models.Meal>> getMeals()
        {
            List<meal> listMealsEntity = new List<meal>();
            List<Meal> listMeals = new List<Meal>();
            using (var connection = new MySqlConnection(csb.ConnectionString))
            {
                connection.Open();
                MySqlCommand cmd = connection.CreateCommand();
                cmd.CommandText = "SELECT * from meals";
                MySqlDataReader reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    IFormatProvider culture = new CultureInfo("en-US", true);
                    meal m = new meal();
                    m.path = reader["path"].ToString();
                    m.tags = reader["tags"].ToString();
                    var x = reader["dateTime"].ToString();
                    m.dateTime = DateTime.ParseExact(x, "dd/MM/yyyy HH:mm:ss", culture);
                    listMealsEntity.Add(m);
                }
            }
            listMeals = listMealsEntity.Select<meal, Meal>(m => Mapper.convertEntityToMeal(m)).ToList<Meal>();//listMealsEntity.Select<meal,object/*api obj*/>(Mapper.convertEntityToMeal);
            return listMeals;
        }

        public static List<Meal> getMealsToDay(DateTime date)
        {
            List<meal> meals = new List<meal>();
            using (var connection = new MySqlConnection(csb.ConnectionString))
            {
                connection.Open();
                MySqlCommand cmd = connection.CreateCommand();
                cmd.CommandText = "select * from meals where SUBSTRING_INDEX(dateTime, '/', 2) = SUBSTRING_INDEX(@dateT, '/', 2)";
                cmd.Parameters.Add("@dateT", MySqlDbType.String).Value = date.ToString("dd/MM/yyyy HH:mm:ss");
                //cmd.CommandText = "SELECT * from meals where dateTime = '" + date.ToString() + "'";
                MySqlDataReader reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    CultureInfo provider = CultureInfo.InvariantCulture;
                    meal m = new meal();
                    m.path = reader["path"].ToString();
                    m.tags = reader["tags"].ToString();
                    var x = reader["dateTime"];
                    IFormatProvider culture = new CultureInfo("en-US", true);
                    m.dateTime = DateTime.ParseExact(reader["dateTime"].ToString(), "dd/MM/yyyy HH:mm:ss", culture);
                    meals.Add(m);
                }
            }
            List<Meal> listMealToDay = meals.Select<meal, Meal>(m => Mapper.convertEntityToMeal(m)).ToList<Meal>();
            return listMealToDay;
        }

        public static List<Meal> getMealsByLabel(string label)
        {
            List<meal> meals = new List<meal>();
            using (var connection = new MySqlConnection(csb.ConnectionString))
            {
                connection.Open();
                MySqlCommand cmd = connection.CreateCommand();
                cmd.CommandText = "SELECT * from meals where FIND_IN_SET('" + label + "', tags)";
                MySqlDataReader reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    IFormatProvider culture = new CultureInfo("en-US", true);
                    meal m = new meal();
                    m.path = reader["path"].ToString();
                    m.tags = reader["tags"].ToString();
                    var x = reader["dateTime"].ToString();
                    m.dateTime = DateTime.ParseExact(x, "dd/MM/yyyy HH:mm:ss", culture);
                    meals.Add(m);
                }
            }
            List<Meal> listMealToDay = meals.Select<meal, Meal>(m => Mapper.convertEntityToMeal(m)).ToList<Meal>();
            return listMealToDay;
        }

        public static List<string> GetLabels()
        {
            List<string> listLabels = new List<string>();
            SortedSet<string> labelsSet = new SortedSet<string>();
            using (var connection = new MySqlConnection(csb.ConnectionString))
            {
                try
                {
                    connection.Open();
                    MySqlCommand cmd = connection.CreateCommand();
                    cmd.CommandText = "SELECT tags from meals";
                    MySqlDataReader reader = cmd.ExecuteReader();
                    while (reader.Read())
                    {
                        listLabels.Add(reader[0].ToString());
                    }
                }
                catch (MySqlException e)
                {

                    throw e;
                }

            }
            listLabels.ForEach(ls => ls.Split(',').ToList().ForEach(l => labelsSet.Add(l)));
            return labelsSet.ToList();
        }

        /// <summary>
        /// func to upload file to google cloud storage.
        /// </summary>
        /// <param name="bucketName">the google cloud bucket name</param>
        /// <param name="imageString">the base64 image string</param>
        /// <param name="objectName"></param>
        /// <returns></returns>
        public static string UploadFileToStorage(string bucketName, string imageString, DateTime DateOfPic, string objectName = null)
        {
            Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", "C:\\key\\DietDiary-f95b600d05ed.json");
            var storage = StorageClient.Create();
            var base64Data = Regex.Match(imageString, @"data:image/(?<type>.+?),(?<data>.+)").Groups["data"].Value;
            var binData = Convert.FromBase64String(base64Data);
            BinaryWriter Writer = null;
            string p = "";
            string Name = "";

            try
            {
                p = "C:\\key\\";
                Name = Path.Combine(p, "pic.jpg");
            }
            catch (Exception e)
            {

                p = HttpRuntime.AppDomainAppPath;
                Name = Path.Combine(p, "App_Data", "pic.jpg");
            }
            try
            {
                // Create a new stream to write to the file
                Writer = new BinaryWriter(File.OpenWrite(Name));
                // Writer raw data
                Writer.Write(binData);
                Writer.Flush();
                Writer.Close();
            }
            catch (UnauthorizedAccessException e)
            {
                throw e;
            }
            catch (DirectoryNotFoundException e)
            {
                throw e;
            }
            using (var f = File.OpenRead(Name))
            {
                objectName = DateOfPic.ToString(@"dd\-MM\-yyyy-h\:mm") + ".jpg";
                var x = storage.UploadObject(bucketName, objectName, null, f);
                Console.WriteLine($"Uploaded {objectName}.");
            }
            return path + bucketName + "/" + objectName;
        }
    }
}