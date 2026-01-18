import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateAssignedModuleDto } from './dto/create-assigned-module.dto';
import { UpdateAssignedModuleDto } from './dto/update-assigned-module.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AssignedModule } from './entities/assigned-module.entity';
import { DataSource, Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import {
  SysModule,
  UserDetail,
  Users,
} from 'src/entities';

@Injectable()
export class AssignedModulesService {
  constructor(
    @InjectRepository(AssignedModule)
    private readonly assmodRep: Repository<AssignedModule>,
    private dataSource: DataSource,
  ) {}
  // async create(createAssignedModuleDto: CreateAssignedModuleDto) {
  //   var selectedmods = [];
  //   try {
  //     let mods = JSON.parse(createAssignedModuleDto.assign_mods);

  //     for (let i = 0; i < mods.length; i++) {
  //       let modsEl = mods[i];
  //       selectedmods.push(modsEl.id);
  //       if (modsEl.subLink) {
  //         let sl = modsEl.subLink;
  //         for (let j = 0; j < sl.length; j++) {
  //           let msl = sl[j];
  //           selectedmods.push(msl.id);
  //         }
  //       }
  //     }

  //     let newAssignMod = this.assmodRep.create({
  //       description: createAssignedModuleDto.description,
  //       assign_mods: createAssignedModuleDto.assign_mods,
  //       selected_modules: JSON.stringify(selectedmods),
  //     });

  //     await this.assmodRep.save(newAssignMod);
  //     return {
  //       msg: 'Saved successfully.',
  //       status: HttpStatus.CREATED,
  //     };
  //   } catch (error) {
  //     return {
  //       msg: 'Saving failed',
  //       status: HttpStatus.BAD_REQUEST,
  //     };
  //   }
  // }
  async create(createAssignedModuleDto: CreateAssignedModuleDto) {
  const selectedmods: number[] = []; // ✅ FIX

  try {
    const mods = JSON.parse(createAssignedModuleDto.assign_mods);

    for (let i = 0; i < mods.length; i++) {
      const modsEl = mods[i];
      selectedmods.push(modsEl.id);

      if (modsEl.subLink) {
        const sl = modsEl.subLink;
        for (let j = 0; j < sl.length; j++) {
          const msl = sl[j];
          selectedmods.push(msl.id);
        }
      }
    }

    const newAssignMod = this.assmodRep.create({
      description: createAssignedModuleDto.description,
      assign_mods: createAssignedModuleDto.assign_mods,
      selected_modules: JSON.stringify(selectedmods),
    });

    await this.assmodRep.save(newAssignMod);

    return {
      msg: 'Saved successfully.',
      status: HttpStatus.CREATED,
    };
  } catch (error) {
    return {
      msg: 'Saving failed',
      status: HttpStatus.BAD_REQUEST,
    };
  }
}


  // findAll() {
  //   // return this.assmodRep.find();

  // }

  async findAll() {
  const modules = await this.dataSource
    .createQueryBuilder(AssignedModule, 'am')
    .where('am.id NOT IN (:...excludedIds)', {
      excludedIds: [1, 4],
    })
    .getMany();

  return modules;
 }

  // async getMyAssignedModules(user: any) {
  //   let us = await this.dataSource
  //     .createQueryBuilder(Users, 'us')
  //     .where('us.id = :id', { id: user.userdetail.user.id })
  //     .getOne();
  //   let d = await this.getCECAndCRC(user.userdetail.id);
  //   console.log('has', d);
  //   let data = await this.assmodRep
  //     .createQueryBuilder('am')
  //     .where('am.id = :amID', { amID: us.assignedModuleID })
  //     .getOne();
  //   let mods = JSON.parse(data.assign_mods);

  //   if (d.isAMember) {
  //     let idx = mods.findIndex((d) => d.id === 98); //PERFORMANCE EVALUATION GROUP NAVIGATION
  //     mods.splice(idx + 1, 0, d.modules);
  //     data.assign_mods = JSON.stringify(mods);
  //   }

  //   return data;
  // }
  
  async getMyAssignedModules(user: any) {

  const us = await this.dataSource
    .createQueryBuilder(Users, 'us')
    .where('us.id = :id', { id: user.userdetail.user.id })
    .getOne();

  if (!us) {
    throw new NotFoundException('User not found');
  }

  const data = await this.assmodRep
    .createQueryBuilder('am')
    .where('am.id = :amID', { amID: us.assignedModuleID })
    .getOne();

  if (!data) {
    throw new NotFoundException('Assigned modules not found');
  }

  return data;
}


  findOne(id: number) {
    return this.assmodRep.findOneBy({ id });
  }

  // async getRemainingModules(id: number) {
  //   let am = await this.assmodRep
  //     .createQueryBuilder('am')
  //     .where('am.id = :id', { id })
  //     .getOne();

  //   let select = JSON.parse(am.selected_modules);
  //   console.log(select);
  //   if (am.selected_modules != '[]') {
  //     let sm = await this.dataSource
  //       .createQueryBuilder(SysModule, 'sysmod')
  //       .where('sysmod.id NOT IN (:selected)', { selected: select })
  //       .getMany();
  //     for (let i = 0; i < sm.length; i++) {
  //       let element = sm[i];

  //       if (element.isParent == true) {
  //         Object.assign(sm[i], { subLink: [] });
  //       }
  //     }
  //     return sm;
  //   } else {
  //     let sm = await this.dataSource
  //       .createQueryBuilder(SysModule, 'sysmod')
  //       .getMany();
  //     for (let i = 0; i < sm.length; i++) {
  //       let element = sm[i];

  //       if (element.isParent == true) {
  //         Object.assign(sm[i], { subLink: [] });
  //       }
  //     }
  //     return sm;
  //   }
  // }
  async getRemainingModules(id: number) {
  const am = await this.assmodRep
    .createQueryBuilder('am')
    .where('am.id = :id', { id })
    .getOne();

  if (!am) {
    throw new NotFoundException('Assigned module not found');
  }

  const selected: number[] = JSON.parse(am.selected_modules ?? '[]');

  let sm: SysModule[];
  if (selected.length > 0) {
    sm = await this.dataSource
      .createQueryBuilder(SysModule, 'sysmod')
      .where('sysmod.id NOT IN (:...selected)', { selected })
      .getMany();
  } else {
    sm = await this.dataSource
      .createQueryBuilder(SysModule, 'sysmod')
      .getMany();
  }
  for (let i = 0; i < sm.length; i++) {
    if (sm[i].isParent === true) {
      Object.assign(sm[i], { subLink: [] });
    }
  }

  return sm;
}


  // async update(id: number, updateAssignedModuleDto: UpdateAssignedModuleDto) {
  //   var selectedmods = [];
  //   try {
  //     let mods = JSON.parse(updateAssignedModuleDto.assign_mods);

  //     for (let i = 0; i < mods.length; i++) {
  //       // console.log('mods', mods[i]);
  //       let modsEl = mods[i];
  //       selectedmods.push(modsEl.id);
  //       if (modsEl.subLink) {
  //         let sl = modsEl.subLink;
  //         for (let j = 0; j < sl.length; j++) {
  //           let msl = sl[j];
  //           selectedmods.push(msl.id);
  //         }
  //       }
  //     }

  //     await this.assmodRep.update(id, {
  //       description: updateAssignedModuleDto.description,
  //       assign_mods: updateAssignedModuleDto.assign_mods,
  //       selected_modules: JSON.stringify(selectedmods),
  //     });
  //     return {
  //       msg: 'Saved successfully.',
  //       status: HttpStatus.OK,
  //     };
  //   } catch (error) {
  //     return {
  //       msg: 'Saving failed',
  //       status: HttpStatus.BAD_REQUEST,
  //     };
  //   }
  // }

  async update(id: number, updateAssignedModuleDto: UpdateAssignedModuleDto) {
  let selectedmods: number[] = [];
  
  // Check existence first
  const existing = await this.assmodRep.findOneBy({ id });
  if (!existing) {
    return {
      msg: 'Assigned module not found',
      status: HttpStatus.NOT_FOUND,
    };
  }

  try {
    if (!updateAssignedModuleDto.assign_mods) {
      return {
        msg: 'assign_mods is required',
        status: HttpStatus.BAD_REQUEST,
      };
    }
    const mods: any[] = JSON.parse(updateAssignedModuleDto.assign_mods);

    const flattenModules = (mods: any[]): number[] =>
      mods.reduce<number[]>((acc, mod) => {
        acc.push(mod.id);
        if (mod.subLink) acc.push(...flattenModules(mod.subLink));
        return acc;
      }, []);

    selectedmods = flattenModules(mods);

    await this.assmodRep.update(id, {
      description: updateAssignedModuleDto.description,
      assign_mods: updateAssignedModuleDto.assign_mods,
      selected_modules: JSON.stringify(selectedmods),
    });

    return {
      msg: 'Saved successfully.',
      status: HttpStatus.OK,
    };
  } catch (error) {
    return {
      msg: 'Saving failed',
      status: HttpStatus.BAD_REQUEST,
    };
  }
}


  async remove(id: number) {
    try {
      await this.assmodRep.delete(id);
      return {
        msg: 'Deleted successfully.',
        status: HttpStatus.OK,
      };
    } catch (error) {
      return {
        msg: 'Deletion failed',
        status: HttpStatus.BAD_REQUEST,
      };
    }
  }
}
