# Generated by Django 4.0.6 on 2024-10-09 06:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bomdata', '0005_alter_component_bom_alter_component_main_component'),
    ]

    operations = [
        migrations.AddField(
            model_name='specification',
            name='objective',
            field=models.TextField(blank=True),
        ),
    ]
