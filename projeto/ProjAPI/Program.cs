using ProjetoConsole.Repository;
using ProjetoConsole.Repository.Implementations;
using ProjetoConsole.Services;
using NHibernate.Cfg;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.ReferenceHandler =
            ReferenceHandler.IgnoreCycles;
    });


builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddTransient<ClienteService>();
builder.Services.AddTransient<DividaService>();

var isInMemory = builder.Configuration.GetValue("UseInMemory", false);
if (isInMemory)
{
    builder.Services.AddTransient<IRepository, RepositoryInMemory>();
}
else
{
    var connectionString = builder.Configuration
        .GetConnectionString("DefaultConnection");
    // criar implementacao para ISessionFactory
    builder.Services.AddSingleton(c =>
    {
        var config = new Configuration().Configure();
        config.DataBaseIntegration(
            x => x.ConnectionString = connectionString
        );
        return config.BuildSessionFactory(); 
    });
    builder.Services.AddTransient<IRepository, RepositoryNHibernate>();
}

var app = builder.Build();

// Configure the HTTP request pipeline.

//convencional
//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    app.UseSwaggerUI();
//}

//por conta do deploy fica dessa forma
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors(
    b => b.AllowAnyHeader()
        .AllowAnyMethod()
        .AllowAnyOrigin()
    );

var port = System.Environment.GetEnvironmentVariable("PORT") ?? "10000";
app.Urls.Add($"http://*:{port}");

//app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
